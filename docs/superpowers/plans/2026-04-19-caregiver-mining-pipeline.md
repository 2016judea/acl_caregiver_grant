# Caregiver Mining Pipeline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a data mining, analysis, and retrieval pipeline that collects caregiver community posts, extracts structured pain points via Claude API, stores them in DuckDB + ChromaDB, and exposes a CLI query interface for grant writing sessions.

**Architecture:** Sequential pipeline — collect → process → analyze → embed → query. Each stage is an independently runnable module in `src/`. DuckDB holds structured relational data; ChromaDB holds semantic embeddings for fuzzy retrieval. A top-level `run_pipeline.py` orchestrates all stages with `--stage`, `--from`, and `--dry-run` flags. The `process` stage persists normalized text and caregiver-type classifications back to DuckDB so subsequent stages work from clean data.

**Tech Stack:** Python 3.11+, praw, requests, beautifulsoup4, anthropic (claude-sonnet-4-6), duckdb, chromadb, sentence-transformers (all-mpnet-base-v2), tenacity, python-dotenv, tqdm, click

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/db.py` | DuckDB schema creation + ChromaDB client init |
| `src/collector.py` | BaseCollector + Reddit/AgingCare collectors → DuckDB posts/comments |
| `src/processor.py` | Dedup, filter, normalize, caregiver-type classification (Haiku), chunk, persist to DuckDB |
| `src/analyzer.py` | Batch Claude API calls → pain_points + quotes → DuckDB |
| `src/embedder.py` | Load sentence-transformer, embed 4 ChromaDB collections |
| `src/synthesizer.py` | Aggregate themes from DuckDB, call Claude for application_angle, write theme_summaries |
| `src/report.py` | Generate markdown reports from DuckDB data |
| `query.py` | CLI: search (Chroma), stats/top/themes (DuckDB) |
| `run_pipeline.py` | Orchestrator with stage flags |
| `tests/conftest.py` | autouse fixture resetting db.py singletons between tests |
| `tests/test_db.py` | DB schema idempotency tests |
| `tests/test_processor.py` | Dedup, filter, normalize, chunking, caregiver-type tests |
| `tests/test_analyzer.py` | Batch construction, JSON parsing, DuckDB write tests |
| `tests/test_embedder.py` | Chroma collection population tests |
| `tests/test_query.py` | CLI output format + filter tests |
| `.env.example` | Template for required env vars |
| `requirements.txt` | Pinned dependencies |

---

## Chunk 1: Infrastructure — scaffold, db, collector, processor

### Task 1: Project Scaffold

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `src/__init__.py`
- Create: `tests/__init__.py`
- Create: `tests/conftest.py`
- Create: `data/.gitkeep`
- Create: `reports/.gitkeep`
- Create: `.gitignore`

- [ ] **Step 1: Create directory structure**

```bash
cd /Users/aidan/Desktop/workspace/acl_caregiver_grant
mkdir -p src tests data reports
touch src/__init__.py tests/__init__.py data/.gitkeep reports/.gitkeep
```

- [ ] **Step 2: Write `requirements.txt`**

```
praw==7.7.1
requests==2.32.3
beautifulsoup4==4.12.3
lxml==5.2.2
anthropic>=0.52.0
duckdb==1.1.3
chromadb==0.5.23
sentence-transformers==3.3.1
tenacity==9.0.0
python-dotenv==1.0.1
tqdm==4.67.1
click==8.1.7
pytest==8.3.4
pytest-mock==3.14.0
```

- [ ] **Step 3: Write `.env.example`**

```
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=caregiver-mining/1.0
ANTHROPIC_API_KEY=
DUCKDB_PATH=./data/insights.duckdb
CHROMA_PATH=./data/chroma
```

- [ ] **Step 4: Write `.gitignore`**

```
.env
.mining_state.json
data/insights.duckdb
data/chroma/
analysis_log.json
__pycache__/
*.pyc
.pytest_cache/
```

- [ ] **Step 5: Write `tests/conftest.py`**

```python
# tests/conftest.py
import pytest

@pytest.fixture(autouse=True)
def reset_db_singletons():
    """
    db.py caches connections as module-level globals. Without this fixture,
    the first test's tmp_path connection bleeds into all subsequent tests.
    """
    import src.db as db_module
    db_module._duck_conn = None
    db_module._chroma_client = None
    yield
    if db_module._duck_conn:
        db_module._duck_conn.close()
    db_module._duck_conn = None
    db_module._chroma_client = None
```

- [ ] **Step 6: Install dependencies**

```bash
pip install -r requirements.txt
```

- [ ] **Step 7: Commit**

```bash
git init
git add requirements.txt .env.example .gitignore src/__init__.py tests/__init__.py tests/conftest.py
git commit -m "feat: project scaffold"
```

---

### Task 2: `db.py` — Schema and connections

**Files:**
- Create: `src/db.py`
- Create: `tests/test_db.py`

> **Schema note:** The `posts` table includes `is_processed`, `normalized_body`, and `caregiver_type_heuristic` so the processor can persist its results and the analyzer can filter `WHERE is_processed = TRUE`. Without this, re-runs of `--from analyze` would process raw, un-deduplicated posts.

- [ ] **Step 1: Write the failing test**

```python
# tests/test_db.py
import os, pytest
import duckdb, chromadb

def test_create_schema_idempotent(tmp_path):
    """Schema creation must be idempotent — no error on second call."""
    os.environ["DUCKDB_PATH"] = str(tmp_path / "test.duckdb")
    os.environ["CHROMA_PATH"] = str(tmp_path / "chroma")

    from src.db import init_db, get_duck
    init_db()
    init_db()  # second call must not raise

    conn = get_duck()
    tables = conn.execute("SHOW TABLES").fetchall()
    table_names = {t[0] for t in tables}
    assert {"posts", "comments", "pain_points", "quotes", "theme_summaries"} == table_names

def test_posts_table_has_processing_columns(tmp_path):
    os.environ["DUCKDB_PATH"] = str(tmp_path / "test.duckdb")
    os.environ["CHROMA_PATH"] = str(tmp_path / "chroma")

    from src.db import init_db, get_duck
    init_db()
    conn = get_duck()
    cols = {r[0] for r in conn.execute("DESCRIBE posts").fetchall()}
    assert {"is_processed", "normalized_body", "caregiver_type_heuristic"}.issubset(cols)

def test_chroma_collections_created(tmp_path):
    os.environ["DUCKDB_PATH"] = str(tmp_path / "test.duckdb")
    os.environ["CHROMA_PATH"] = str(tmp_path / "chroma")

    from src.db import init_db, get_chroma
    init_db()
    client = get_chroma()
    names = {c.name for c in client.list_collections()}
    assert {"pain_points", "quotes", "theme_summaries", "post_chunks"} == names
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_db.py -v
```
Expected: FAIL — `ModuleNotFoundError: src.db`

- [ ] **Step 3: Write `src/db.py`**

```python
import os
import duckdb
import chromadb
from dotenv import load_dotenv

load_dotenv()

_duck_conn = None
_chroma_client = None

def get_duck() -> duckdb.DuckDBPyConnection:
    global _duck_conn
    if _duck_conn is None:
        path = os.environ.get("DUCKDB_PATH", "./data/insights.duckdb")
        dir_path = os.path.dirname(path)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        _duck_conn = duckdb.connect(path)
    return _duck_conn

def get_chroma() -> chromadb.ClientAPI:
    global _chroma_client
    if _chroma_client is None:
        path = os.environ.get("CHROMA_PATH", "./data/chroma")
        os.makedirs(path, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=path)
    return _chroma_client

def init_db():
    conn = get_duck()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id VARCHAR PRIMARY KEY,
            source VARCHAR,
            subreddit VARCHAR,
            url VARCHAR,
            title VARCHAR,
            body TEXT,
            author VARCHAR,
            created_at TIMESTAMP,
            score INTEGER,
            num_comments INTEGER,
            word_count INTEGER,
            collected_at TIMESTAMP DEFAULT now(),
            is_processed BOOLEAN DEFAULT FALSE,
            normalized_body TEXT,
            caregiver_type_heuristic VARCHAR
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id VARCHAR PRIMARY KEY,
            post_id VARCHAR REFERENCES posts(id),
            body TEXT,
            author VARCHAR,
            score INTEGER,
            created_at TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS pain_points (
            id VARCHAR PRIMARY KEY,
            post_id VARCHAR,
            source_text TEXT,
            pain_point TEXT,
            category VARCHAR,
            track_relevance VARCHAR,
            track1_signal TEXT,
            track2_signal TEXT,
            severity_score INTEGER,
            frequency_indicator VARCHAR,
            caregiver_type VARCHAR,
            care_recipient VARCHAR,
            extracted_at TIMESTAMP DEFAULT now()
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS quotes (
            id VARCHAR PRIMARY KEY,
            post_id VARCHAR,
            quote TEXT,
            context TEXT,
            track_relevance VARCHAR,
            theme VARCHAR,
            quality_score INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS theme_summaries (
            theme VARCHAR PRIMARY KEY,
            description TEXT,
            post_count INTEGER,
            avg_severity FLOAT,
            track_relevance VARCHAR,
            top_categories VARCHAR,
            sample_quote TEXT,
            application_angle TEXT
        )
    """)

    client = get_chroma()
    for name in ("pain_points", "quotes", "theme_summaries", "post_chunks"):
        client.get_or_create_collection(name)

if __name__ == "__main__":
    init_db()
    print("DB initialized.")
    conn = get_duck()
    tables = conn.execute("SHOW TABLES").fetchall()
    print("Tables:", [t[0] for t in tables])
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_db.py -v
```
Expected: 3 PASSED

- [ ] **Step 5: Verify standalone run**

```bash
python src/db.py
```
Expected: `DB initialized. Tables: [...]` — no errors

- [ ] **Step 6: Commit**

```bash
git add src/db.py tests/test_db.py
git commit -m "feat: duckdb schema + chromadb init"
```

---

### Task 3: `processor.py` — Dedup, filter, normalize, classify, chunk, persist

**Files:**
- Create: `src/processor.py`
- Create: `tests/test_processor.py`

> **Design note:** The caregiver-type classifier uses `claude-haiku-4-5` (Haiku) rather than the keyword list in DESIGN.md. Keyword lists are brittle and grow unbounded — Haiku handles nuanced cases like "I work as an aide for my own grandmother" without a rule. To avoid 1 API call per post (which at 10k posts = 1.4–2.8hrs), posts are batched 10 at a time in a single Haiku call that returns a JSON array of labels. Cost: ~$0.35 total. The processor writes `is_processed=TRUE`, `normalized_body`, and `caregiver_type_heuristic` back to DuckDB so `analyzer.py` can filter `WHERE is_processed = TRUE` for clean, deduplicated input.

- [ ] **Step 1: Write failing tests**

```python
# tests/test_processor.py
import pytest
from src.processor import (
    normalize_text, is_too_short, is_duplicate, content_hash,
    chunk_text, ProcessedPost
)

def test_normalize_strips_urls():
    text = "Check this https://reddit.com/r/foo out"
    assert "https://" not in normalize_text(text)

def test_normalize_strips_mentions():
    assert "@username" not in normalize_text("hello @username how are you")

def test_normalize_collapses_whitespace():
    assert "  " not in normalize_text("too   many    spaces")

def test_too_short_under_50_words():
    assert is_too_short("short post") is True

def test_too_short_over_50_words():
    text = " ".join(["word"] * 60)
    assert is_too_short(text) is False

def test_duplicate_detection_identical():
    h = content_hash("same text")
    assert is_duplicate("same text", {h}) is True

def test_duplicate_detection_unique():
    assert is_duplicate("completely different content here", set()) is False

def test_chunk_short_post_no_split():
    text = " ".join(["word"] * 300)
    chunks = chunk_text(text)
    assert len(chunks) == 1

def test_chunk_long_post_splits():
    text = " ".join(["word"] * 800)
    chunks = chunk_text(text)
    assert len(chunks) >= 2

def test_chunk_overlap():
    text = " ".join([f"w{i}" for i in range(800)])
    chunks = chunk_text(text)
    last_words_c0 = set(chunks[0].split()[-50:])
    first_words_c1 = set(chunks[1].split()[:50])
    assert len(last_words_c0 & first_words_c1) > 0
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_processor.py -v
```
Expected: FAIL — module not found

- [ ] **Step 3: Write `src/processor.py`**

```python
import re
import hashlib
import json
import logging
from dataclasses import dataclass, field
from typing import Optional
import duckdb

logger = logging.getLogger(__name__)

CHUNK_SIZE = 400
CHUNK_OVERLAP = 100
CLASSIFY_BATCH_SIZE = 10

@dataclass
class ProcessedPost:
    id: str
    source: str
    subreddit: Optional[str]
    title: str
    body_normalized: str
    caregiver_type: str  # 'family' | 'paid_direct_care' | 'unclear'
    chunks: list[str] = field(default_factory=list)
    content_hash: str = ""

def normalize_text(text: str) -> str:
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"\*+|#+|_{2,}", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def is_too_short(text: str) -> bool:
    return len(text.split()) < 50

def content_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()

def is_duplicate(text: str, seen_hashes: set[str]) -> bool:
    return content_hash(text) in seen_hashes

def chunk_text(text: str) -> list[str]:
    words = text.split()
    if len(words) <= CHUNK_SIZE:
        return [text]
    chunks = []
    start = 0
    while start < len(words):
        end = start + CHUNK_SIZE
        chunks.append(" ".join(words[start:end]))
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks

def classify_caregiver_types_batch(posts: list[tuple[str, str]]) -> list[str]:
    """
    Classify up to CLASSIFY_BATCH_SIZE posts in one Haiku call.
    posts: list of (title, body_first_300_words)
    Returns list of 'family' | 'paid_direct_care' | 'unclear' in same order.
    Falls back to 'unclear' for each item on any error.
    """
    import anthropic, os
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    items = "\n".join(
        f'{i+1}. TITLE: {t}\nBODY: {" ".join(b.split()[:300])}'
        for i, (t, b) in enumerate(posts)
    )
    prompt = (
        f"Classify each caregiver post as exactly one of: family, paid_direct_care, unclear.\n"
        f"- family: caring for a relative/loved one without pay\n"
        f"- paid_direct_care: a paid aide, CNA, DSP, or agency worker\n"
        f"- unclear: cannot determine\n\n"
        f"{items}\n\n"
        f"Respond ONLY with a JSON array of {len(posts)} strings, in order. "
        f'Example: ["family", "paid_direct_care", "unclear"]'
    )
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=len(posts) * 20,
            messages=[{"role": "user", "content": prompt}],
        )
        results = json.loads(msg.content[0].text.strip())
        valid = {"family", "paid_direct_care", "unclear"}
        return [r if r in valid else "unclear" for r in results]
    except Exception as e:
        logger.warning(f"[processor] batch classification failed: {e}")
        return ["unclear"] * len(posts)

def process_posts(conn: duckdb.DuckDBPyConnection) -> list[ProcessedPost]:
    rows = conn.execute(
        "SELECT id, source, subreddit, title, body FROM posts WHERE is_processed = FALSE"
    ).fetchall()

    seen_hashes: set[str] = set()
    to_classify: list[ProcessedPost] = []
    dropped = {"too_short": 0, "duplicate": 0}

    for id_, source, subreddit, title, body in rows:
        body = body or ""
        normalized = normalize_text(body)

        if is_too_short(normalized):
            dropped["too_short"] += 1
            conn.execute(
                "UPDATE posts SET is_processed = TRUE WHERE id = ?", (id_,)
            )
            continue

        h = content_hash(normalized)
        if h in seen_hashes:
            dropped["duplicate"] += 1
            conn.execute(
                "UPDATE posts SET is_processed = TRUE WHERE id = ?", (id_,)
            )
            continue
        seen_hashes.add(h)

        to_classify.append(ProcessedPost(
            id=id_,
            source=source,
            subreddit=subreddit,
            title=title or "",
            body_normalized=normalized,
            caregiver_type="unclear",
            chunks=chunk_text(normalized),
            content_hash=h,
        ))

    # Batch classify
    for i in range(0, len(to_classify), CLASSIFY_BATCH_SIZE):
        batch = to_classify[i:i + CLASSIFY_BATCH_SIZE]
        labels = classify_caregiver_types_batch(
            [(p.title, p.body_normalized) for p in batch]
        )
        for post, label in zip(batch, labels):
            post.caregiver_type = label
            conn.execute(
                """UPDATE posts SET
                       is_processed = TRUE,
                       normalized_body = ?,
                       caregiver_type_heuristic = ?
                   WHERE id = ?""",
                (post.body_normalized, label, post.id),
            )

    logger.info(
        f"[processor] {len(to_classify)} processed | "
        f"{dropped['too_short']} too short | {dropped['duplicate']} duplicates"
    )
    return to_classify

def run():
    from src.db import get_duck, init_db
    init_db()
    conn = get_duck()
    posts = process_posts(conn)
    print(f"Processed {len(posts)} posts.")
    for p in posts[:3]:
        print(f"  [{p.caregiver_type}] {p.id}: {len(p.chunks)} chunks — {p.body_normalized[:80]}…")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_processor.py -v
```
Expected: 10 PASSED

- [ ] **Step 5: Commit**

```bash
git add src/processor.py tests/test_processor.py
git commit -m "feat: processor — normalize, dedup, batch classify, persist to DuckDB"
```

---

### Task 4: `collector.py` — Reddit collector + checkpointing

**Files:**
- Create: `src/collector.py`
- Create: `tests/test_collector.py`

> **Pre-req:** Reddit API credentials must be in `.env` before running live. Register app at reddit.com/prefs/apps (script type).

- [ ] **Step 1: Write failing tests**

```python
# tests/test_collector.py
import json, os, pytest
from unittest.mock import MagicMock, patch

def test_checkpoint_roundtrip(tmp_path):
    os.environ["MINING_STATE_PATH"] = str(tmp_path / "state.json")
    from src.collector import save_checkpoint, load_checkpoint
    save_checkpoint("reddit_AgingParents", {"abc123", "def456"})
    loaded = load_checkpoint("reddit_AgingParents")
    assert loaded == {"abc123", "def456"}

def test_checkpoint_missing_returns_empty(tmp_path):
    os.environ["MINING_STATE_PATH"] = str(tmp_path / "state.json")
    from src.collector import load_checkpoint
    assert load_checkpoint("nonexistent_source") == set()

def test_reddit_collector_skips_checkpointed(tmp_path):
    """Collector skips post IDs already in checkpoint."""
    os.environ["MINING_STATE_PATH"] = str(tmp_path / "state.json")
    os.environ["DUCKDB_PATH"] = str(tmp_path / "test.duckdb")

    from src.db import init_db
    init_db()

    from src.collector import save_checkpoint, RedditCollector
    save_checkpoint("reddit_AgingParents", {"already_seen_id"})

    mock_post = MagicMock()
    mock_post.id = "already_seen_id"
    mock_post.title = "Test"
    mock_post.selftext = "Some body text here that is long enough"
    mock_post.author = MagicMock()
    mock_post.author.name = "testuser"
    mock_post.created_utc = 1700000000
    mock_post.score = 10
    mock_post.num_comments = 2
    mock_post.url = "https://reddit.com/test"
    mock_post.comments = MagicMock()
    mock_post.comments.list.return_value = []

    with patch("praw.Reddit") as mock_reddit:
        mock_reddit.return_value.subreddit.return_value.hot.return_value = [mock_post]
        mock_reddit.return_value.subreddit.return_value.top.return_value = []
        collector = RedditCollector(subreddits=["AgingParents"], post_limit=10)
        new_count = collector.collect()

    assert new_count == 0
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_collector.py -v
```

- [ ] **Step 3: Write `src/collector.py`**

```python
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional
import praw
import requests
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv
import duckdb

load_dotenv()
logger = logging.getLogger(__name__)

def _state_path() -> str:
    return os.environ.get("MINING_STATE_PATH", ".mining_state.json")

def _load_state() -> dict:
    p = _state_path()
    if os.path.exists(p):
        with open(p) as f:
            return json.load(f)
    return {}

def _save_state(state: dict):
    with open(_state_path(), "w") as f:
        json.dump(state, f)

def load_checkpoint(key: str) -> set[str]:
    return set(_load_state().get(key, []))

def save_checkpoint(key: str, ids: set[str]):
    state = _load_state()
    state[key] = list(ids)
    _save_state(state)


class RedditCollector:
    def __init__(self, subreddits: list[str], post_limit: int = 500):
        self.subreddits = subreddits
        self.post_limit = post_limit
        self.reddit = praw.Reddit(
            client_id=os.environ["REDDIT_CLIENT_ID"],
            client_secret=os.environ["REDDIT_CLIENT_SECRET"],
            user_agent=os.environ.get("REDDIT_USER_AGENT", "caregiver-mining/1.0"),
        )

    def collect(self) -> int:
        from src.db import get_duck, init_db
        init_db()
        conn = get_duck()
        total_new = 0

        for sub in self.subreddits:
            key = f"reddit_{sub}"
            seen = load_checkpoint(key)
            new_ids: set[str] = set()

            feeds = [
                self.reddit.subreddit(sub).hot(limit=self.post_limit),
                self.reddit.subreddit(sub).top(time_filter="year", limit=self.post_limit),
            ]

            for feed in feeds:
                for post in feed:
                    if post.id in seen:
                        continue
                    self._write_post(conn, post, sub)
                    self._write_comments(conn, post)
                    new_ids.add(post.id)

            seen |= new_ids
            save_checkpoint(key, seen)
            total_new += len(new_ids)
            logger.info(f"[collector] r/{sub}: {len(new_ids)} new posts")

        return total_new

    def _write_post(self, conn: duckdb.DuckDBPyConnection, post, subreddit: str):
        body = post.selftext if hasattr(post, "selftext") else ""
        author = post.author.name if post.author else "[deleted]"
        created = datetime.fromtimestamp(post.created_utc, tz=timezone.utc)
        conn.execute("""
            INSERT OR IGNORE INTO posts
            (id, source, subreddit, url, title, body, author, created_at,
             score, num_comments, word_count)
            VALUES (?, 'reddit', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            post.id, subreddit, post.url, post.title, body,
            author, created, post.score, post.num_comments,
            len(body.split()),
        ))

    def _write_comments(self, conn: duckdb.DuckDBPyConnection, post):
        post.comments.replace_more(limit=0)
        for comment in post.comments.list()[:20]:
            if not hasattr(comment, "body"):
                continue
            author = comment.author.name if comment.author else "[deleted]"
            created = datetime.fromtimestamp(comment.created_utc, tz=timezone.utc)
            conn.execute("""
                INSERT OR IGNORE INTO comments
                (id, post_id, body, author, score, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (comment.id, post.id, comment.body, author, comment.score, created))


def run():
    collector = RedditCollector(subreddits=["AgingParents"], post_limit=50)
    n = collector.collect()
    print(f"Collected {n} new posts.")
    from src.db import get_duck
    count = get_duck().execute("SELECT COUNT(*) FROM posts").fetchone()[0]
    print(f"Total posts in DB: {count}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_collector.py -v
```
Expected: 3 PASSED

- [ ] **Step 5: Smoke-test live collection (requires `.env` with Reddit creds)**

```bash
python src/collector.py
```
Expected: prints post count, re-run prints "0 new posts"

- [ ] **Step 6: Commit**

```bash
git add src/collector.py tests/test_collector.py
git commit -m "feat: reddit collector with checkpointing"
```

---

## Chunk 2: Analysis — analyzer, query (DuckDB only)

### Task 5: `analyzer.py` — Batch Claude analysis with dry-run mode

**Files:**
- Create: `src/analyzer.py`
- Create: `tests/test_analyzer.py`

> **Design note:** The Claude response schema includes a `post_id` field in each pain_point and quote. The prompt already sends `POST_ID: {id}` per post, so asking Claude to echo it back costs nothing and is the only way to correctly attribute extracted items to source posts when batching 6 posts per call. Without this, the only alternative is 1 post per call (expensive) or accepting that attribution is lost.

- [ ] **Step 1: Write failing tests**

```python
# tests/test_analyzer.py
import json, os, uuid, pytest
from unittest.mock import patch

MOCK_RESPONSE = {
    "pain_points": [
        {
            "post_id": "p1",
            "pain_point": "No support at 2am during behavioral episodes",
            "category": "emotional_burden",
            "track_relevance": "T1",
            "track1_signal": "AI companion for crisis moments",
            "track2_signal": None,
            "severity_score": 4,
            "frequency_indicator": "recurring",
            "caregiver_type": "family",
            "care_recipient": "dementia",
            "source_text": "I haven't slept in 6 months"
        }
    ],
    "quotes": [
        {
            "post_id": "p1",
            "quote": "I haven't slept more than 3 hours at a time in 6 months",
            "context": "Family caregiver of dementia patient",
            "track_relevance": "T1",
            "theme": "caregiver_exhaustion",
            "quality_score": 5
        }
    ]
}

def test_parse_response_valid():
    from src.analyzer import parse_response
    result = parse_response(json.dumps(MOCK_RESPONSE))
    assert len(result["pain_points"]) == 1
    assert len(result["quotes"]) == 1

def test_parse_response_invalid_json_returns_empty():
    from src.analyzer import parse_response
    result = parse_response("not json at all }")
    assert result["pain_points"] == []
    assert result["quotes"] == []

def test_build_batch_prompt_contains_posts():
    from src.analyzer import build_batch_prompt
    posts = [{"id": "abc", "title": "Help", "body": "I am exhausted"}]
    prompt = build_batch_prompt(posts)
    assert "abc" in prompt
    assert "exhausted" in prompt

def test_dry_run_writes_exactly_one_row_per_post(tmp_path):
    """Each post should produce exactly 1 pain_point row — not BATCH_SIZE rows."""
    os.environ["DUCKDB_PATH"] = str(tmp_path / "test.duckdb")
    os.environ["CHROMA_PATH"] = str(tmp_path / "chroma")
    os.environ["ANTHROPIC_API_KEY"] = "test"

    from src.db import init_db, get_duck
    init_db()
    conn = get_duck()

    conn.execute("""
        INSERT INTO posts (id, source, subreddit, url, title, body, author,
                           created_at, score, num_comments, word_count, is_processed)
        VALUES ('p1', 'reddit', 'AgingParents', 'http://x', 'Test', ?,
                'u1', now(), 5, 2, 60, TRUE)
    """, (" ".join(["word"] * 60),))

    from src.analyzer import run_analysis
    run_analysis(conn, dry_run=True)

    pp_count = conn.execute("SELECT COUNT(*) FROM pain_points").fetchone()[0]
    q_count = conn.execute("SELECT COUNT(*) FROM quotes").fetchone()[0]
    assert pp_count == 1
    assert q_count == 1
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_analyzer.py -v
```

- [ ] **Step 3: Write `src/analyzer.py`**

```python
import json
import logging
import os
import uuid
from typing import Any
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv
import duckdb

load_dotenv()
logger = logging.getLogger(__name__)

BATCH_SIZE = 6
MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You are analyzing posts from caregiver communities to extract structured pain points for an AI tool design challenge with two tracks:

TRACK 1: AI tools that directly help individual caregivers (family or paid) day-to-day — reducing burden, improving communication, managing schedules, monitoring health changes, coordinating with medical providers, supporting caregiver wellbeing.

TRACK 2: AI tools that help ORGANIZATIONS (home care agencies, state programs, co-ops) extend their direct care workforce — automating documentation, improving scheduling, supporting recruitment and retention, reducing admin burden, improving training.

For each post extract all specific, concrete pain points. For each pain point: include the post_id it came from, which track(s) and how, severity (1–5), frequency, caregiver type, care recipient type, and a verbatim source excerpt. Also extract 0–3 high-quality verbatim quotes (1–3 sentences) that vividly express a pain point, each including its post_id.

Respond ONLY with valid JSON matching the schema. No preamble, no markdown fences."""

def build_batch_prompt(posts: list[dict]) -> str:
    parts = []
    for p in posts:
        parts.append(f'POST_ID: {p["id"]}\nTITLE: {p["title"]}\nBODY:\n{p["body"][:1500]}')
    return "\n\n---\n\n".join(parts)

def parse_response(text: str) -> dict:
    try:
        data = json.loads(text)
        data.setdefault("pain_points", [])
        data.setdefault("quotes", [])
        return data
    except (json.JSONDecodeError, AttributeError) as e:
        logger.warning(f"[analyzer] JSON parse failed: {e}")
        return {"pain_points": [], "quotes": []}

@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=4, max=60))
def call_claude(posts: list[dict]) -> dict:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    msg = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_batch_prompt(posts)}],
    )
    return parse_response(msg.content[0].text)

def _write_results(conn: duckdb.DuckDBPyConnection, data: dict, valid_post_ids: set[str]):
    """
    Write all pain_points and quotes from a batch response.
    Each item carries its own post_id echoed from the prompt — we validate it
    is actually in the batch to guard against hallucinated IDs.
    """
    for pp in data.get("pain_points", []):
        post_id = pp.get("post_id", "")
        if post_id not in valid_post_ids:
            logger.warning(f"[analyzer] skipping pain_point with unknown post_id: {post_id!r}")
            continue
        conn.execute("""
            INSERT INTO pain_points
            (id, post_id, source_text, pain_point, category, track_relevance,
             track1_signal, track2_signal, severity_score, frequency_indicator,
             caregiver_type, care_recipient)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), post_id,
            pp.get("source_text", ""), pp.get("pain_point", ""),
            pp.get("category", "other"), pp.get("track_relevance", "both"),
            pp.get("track1_signal"), pp.get("track2_signal"),
            pp.get("severity_score", 3), pp.get("frequency_indicator", "isolated"),
            pp.get("caregiver_type", "unclear"), pp.get("care_recipient", "unclear"),
        ))
    for q in data.get("quotes", []):
        post_id = q.get("post_id", "")
        if post_id not in valid_post_ids:
            logger.warning(f"[analyzer] skipping quote with unknown post_id: {post_id!r}")
            continue
        conn.execute("""
            INSERT INTO quotes (id, post_id, quote, context, track_relevance, theme, quality_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), post_id,
            q.get("quote", ""), q.get("context", ""),
            q.get("track_relevance", "both"), q.get("theme", ""),
            q.get("quality_score", 3),
        ))

def _dry_run_response(batch: list[dict]) -> dict:
    """Generate one pain_point and one quote per post for dry-run testing."""
    return {
        "pain_points": [
            {
                "post_id": p["id"],
                "pain_point": "Mock pain point",
                "category": "other",
                "track_relevance": "both",
                "track1_signal": "mock",
                "track2_signal": "mock",
                "severity_score": 3,
                "frequency_indicator": "isolated",
                "caregiver_type": "unclear",
                "care_recipient": "unclear",
                "source_text": "mock excerpt",
            }
            for p in batch
        ],
        "quotes": [
            {
                "post_id": p["id"],
                "quote": "Mock quote",
                "context": "mock context",
                "track_relevance": "both",
                "theme": "mock",
                "quality_score": 3,
            }
            for p in batch
        ],
    }

def run_analysis(conn: duckdb.DuckDBPyConnection, dry_run: bool = False):
    already_analyzed = {
        r[0] for r in conn.execute("SELECT DISTINCT post_id FROM pain_points").fetchall()
    }
    posts = conn.execute(
        "SELECT id, title, normalized_body FROM posts WHERE is_processed = TRUE"
    ).fetchall()

    to_analyze = [
        {"id": r[0], "title": r[1] or "", "body": r[2] or ""}
        for r in posts if r[0] not in already_analyzed
    ]

    logger.info(f"[analyzer] {len(to_analyze)} posts to analyze")
    log_entries = []

    for i in range(0, len(to_analyze), BATCH_SIZE):
        batch = to_analyze[i:i + BATCH_SIZE]
        valid_ids = {p["id"] for p in batch}

        data = _dry_run_response(batch) if dry_run else call_claude(batch)
        _write_results(conn, data, valid_ids)

        log_entries.append({"batch": i // BATCH_SIZE, "posts": len(batch)})
        logger.info(f"[analyzer] batch {i // BATCH_SIZE + 1}: {len(batch)} posts")

    _write_log(log_entries)

def _write_log(entries: list):
    path = "analysis_log.json"
    existing = []
    if os.path.exists(path):
        with open(path) as f:
            existing = json.load(f)
    with open(path, "w") as f:
        json.dump(existing + entries, f, indent=2)

def run(dry_run: bool = False):
    from src.db import get_duck, init_db
    init_db()
    conn = get_duck()
    run_analysis(conn, dry_run=dry_run)
    pp = conn.execute("SELECT COUNT(*) FROM pain_points").fetchone()[0]
    q = conn.execute("SELECT COUNT(*) FROM quotes").fetchone()[0]
    print(f"pain_points: {pp} | quotes: {q}")

if __name__ == "__main__":
    import argparse, logging
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_analyzer.py -v
```
Expected: 4 PASSED

- [ ] **Step 5: Dry-run smoke test (requires posts with `is_processed=TRUE`)**

Run processor first to populate normalized_body, then dry-run analyzer:

```bash
python src/processor.py
python src/analyzer.py --dry-run
```
Expected: prints pain_point + quote counts, no API calls

- [ ] **Step 6: Commit**

```bash
git add src/analyzer.py tests/test_analyzer.py
git commit -m "feat: analyzer with per-post attribution and dry-run mode"
```

---

### Task 6: `query.py` — DuckDB-backed CLI (structured queries only)

**Files:**
- Create: `query.py`
- Create: `tests/test_query.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_query.py
import os, pytest
from click.testing import CliRunner

def setup_test_db(tmp_path):
    os.environ["DUCKDB_PATH"] = str(tmp_path / "test.duckdb")
    os.environ["CHROMA_PATH"] = str(tmp_path / "chroma")
    from src.db import init_db, get_duck
    init_db()
    conn = get_duck()
    conn.execute("""
        INSERT INTO posts (id, source, subreddit, url, title, body, author,
                           created_at, score, num_comments, word_count)
        VALUES ('p1', 'reddit', 'AgingParents', 'http://x', 'Test', 'body', 'u1', now(), 5, 2, 10)
    """)
    import uuid
    conn.execute("""
        INSERT INTO pain_points
        (id, post_id, source_text, pain_point, category, track_relevance,
         severity_score, frequency_indicator, caregiver_type, care_recipient)
        VALUES (?, 'p1', 'excerpt', 'test pain point', 'emotional_burden', 'T1', 4, 'recurring', 'family', 'dementia')
    """, (str(uuid.uuid4()),))
    return conn

def test_stats_command(tmp_path):
    setup_test_db(tmp_path)
    from query import cli
    runner = CliRunner()
    result = runner.invoke(cli, ["stats"])
    assert result.exit_code == 0
    assert "pain_points" in result.output.lower() or "posts" in result.output.lower()

def test_top_command_with_category(tmp_path):
    setup_test_db(tmp_path)
    from query import cli
    runner = CliRunner()
    result = runner.invoke(cli, ["top", "--category", "emotional_burden"])
    assert result.exit_code == 0
    assert "emotional_burden" in result.output or "test pain point" in result.output

def test_search_stub_when_no_embeddings(tmp_path):
    setup_test_db(tmp_path)
    from query import cli
    runner = CliRunner()
    result = runner.invoke(cli, ["search", "caregiver overwhelmed"])
    assert result.exit_code == 0
    assert "embeddings not yet available" in result.output.lower()
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_query.py -v
```

- [ ] **Step 3: Write `query.py`**

```python
#!/usr/bin/env python3
import os
import click
from dotenv import load_dotenv

load_dotenv()

@click.group()
def cli():
    pass

@cli.command()
def stats():
    """Summary statistics from DuckDB."""
    from src.db import get_duck, init_db
    init_db()
    conn = get_duck()

    posts = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
    pp = conn.execute("SELECT COUNT(*) FROM pain_points").fetchone()[0]
    quotes = conn.execute("SELECT COUNT(*) FROM quotes").fetchone()[0]

    track_rows = conn.execute("""
        SELECT track_relevance, COUNT(*) as n, ROUND(AVG(severity_score), 2) as avg_sev
        FROM pain_points GROUP BY track_relevance ORDER BY n DESC
    """).fetchall()

    cat_rows = conn.execute("""
        SELECT category, COUNT(*) as n FROM pain_points
        GROUP BY category ORDER BY n DESC LIMIT 5
    """).fetchall()

    click.echo(f"\n## Stats\n")
    click.echo(f"Posts: {posts} | Pain points: {pp} | Quotes: {quotes}\n")
    click.echo("### By Track")
    for row in track_rows:
        click.echo(f"  {row[0]}: {row[1]} pain points (avg severity {row[2]})")
    click.echo("\n### Top Categories")
    for row in cat_rows:
        click.echo(f"  {row[0]}: {row[1]}")

@cli.command()
@click.option("--category", default=None, help="Filter by category")
@click.option("--track", default=None, help="T1, T2, or both")
@click.option("--limit", default=10)
def top(category, track, limit):
    """Top pain points by severity."""
    from src.db import get_duck, init_db
    init_db()
    conn = get_duck()

    where = []
    params = []
    if category:
        where.append("category = ?")
        params.append(category)
    if track:
        where.append("track_relevance IN ('both', ?)")
        params.append(track)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    rows = conn.execute(f"""
        SELECT pain_point, category, track_relevance, severity_score,
               caregiver_type, care_recipient, source_text
        FROM pain_points {where_sql}
        ORDER BY severity_score DESC LIMIT ?
    """, params + [limit]).fetchall()

    click.echo(f"\n## Top Pain Points\n")
    for r in rows:
        click.echo(f"### [{r[1]}] severity:{r[3]} | {r[2]} | {r[4]} | {r[5]}")
        click.echo(f"**{r[0]}**")
        click.echo(f"_{r[6]}_\n---")

@cli.command()
@click.option("--track", default=None)
def themes(track):
    """Theme summaries from DuckDB."""
    from src.db import get_duck, init_db
    init_db()
    conn = get_duck()

    where = "WHERE track_relevance = ?" if track else ""
    params = [track] if track else []
    rows = conn.execute(
        f"SELECT theme, description, post_count, avg_severity, application_angle "
        f"FROM theme_summaries {where} ORDER BY post_count DESC",
        params,
    ).fetchall()

    if not rows:
        click.echo("No themes yet. Run synthesizer first.")
        return

    for r in rows:
        click.echo(f"\n### {r[0]} (posts:{r[2]}, avg_severity:{r[3]})")
        click.echo(r[1])
        click.echo(f"**Grant angle:** {r[4]}")

@cli.command()
@click.argument("query_text")
@click.option("--track", default=None)
@click.option("--collection", default=None)
@click.option("--limit", default=5)
def search(query_text, track, collection, limit):
    """Semantic search (requires embeddings to be built first)."""
    try:
        from src.db import get_chroma
        client = get_chroma()
        collections_to_search = (
            [client.get_collection(collection)]
            if collection
            else [
                client.get_collection(n)
                for n in ("pain_points", "quotes", "theme_summaries")
            ]
        )
        total = sum(c.count() for c in collections_to_search)
        if total == 0:
            click.echo("Embeddings not yet available. Run embedder first.")
            return
        _run_search(query_text, collections_to_search, track, limit)
    except Exception as e:
        click.echo(f"Embeddings not yet available: {e}")

def _run_search(query_text, collections, track, limit):
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-mpnet-base-v2")
    embedding = model.encode(query_text).tolist()

    click.echo(f'\n## Query: "{query_text}"\n')
    total_results = 0

    for col in collections:
        count = col.count()
        if count == 0:
            continue
        where = {"track_relevance": {"$in": [track, "both"]}} if track else None
        results = col.query(
            query_embeddings=[embedding],
            n_results=min(limit, count),
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
            total_results += 1
            _print_result(col.name, doc, meta)

    click.echo(f"\nRetrieved {total_results} results")

def _print_result(collection_name, doc, meta):
    track = meta.get("track_relevance", "?")
    caregiver = meta.get("caregiver_type", "?")
    recipient = meta.get("care_recipient", "?")

    if collection_name == "pain_points":
        sev = meta.get("severity_score", "?")
        click.echo(f"### [pain_point] severity:{sev} | {track} | {caregiver} | {recipient}")
        click.echo(f"**{doc}**\n---")
    elif collection_name == "quotes":
        q_score = meta.get("quality_score", "?")
        click.echo(f"### [quote] quality:{q_score} | {track} | {caregiver} | {recipient}")
        click.echo(f'"{doc}"\n---')
    else:
        click.echo(f"### [{collection_name}] | {track}")
        click.echo(f"{doc[:200]}\n---")

if __name__ == "__main__":
    cli()
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_query.py -v
```
Expected: 3 PASSED

- [ ] **Step 5: Smoke test**

```bash
python query.py stats
python query.py top --category emotional_burden
python query.py search "caregiver overwhelmed"
```

- [ ] **Step 6: Commit**

```bash
git add query.py tests/test_query.py
git commit -m "feat: query CLI with DuckDB stats/top/themes and search stub"
```

---

## Chunk 3: Embeddings and semantic search

### Task 7: `embedder.py` — Encode + write to ChromaDB

**Files:**
- Create: `src/embedder.py`
- Create: `tests/test_embedder.py`

> **Metadata note:** `embed_pain_points` and `embed_quotes` join to `posts` to carry the real `source` value ('reddit', 'agingcare', etc.) into ChromaDB metadata. Without this, `source` would be a meaningless "duckdb" label and any downstream filter by source would fail. `embed_post_chunks` embeds `normalized_body` from the `posts` table (written by the processor) and reuses `chunk_text()` from `processor.py` to avoid duplicating the chunking logic.

- [ ] **Step 1: Write failing tests**

```python
# tests/test_embedder.py
import os, uuid, pytest

def setup_db_with_data(tmp_path):
    os.environ["DUCKDB_PATH"] = str(tmp_path / "test.duckdb")
    os.environ["CHROMA_PATH"] = str(tmp_path / "chroma")
    from src.db import init_db, get_duck
    init_db()
    conn = get_duck()
    conn.execute("""
        INSERT INTO posts (id, source, subreddit, url, title, body, normalized_body,
                           author, created_at, score, num_comments, word_count, is_processed)
        VALUES ('p1', 'reddit', 'AgingParents', 'http://x', 'Test',
                'caregiver body text here', 'caregiver body text here',
                'u1', now(), 5, 2, 5, TRUE)
    """)
    conn.execute("""
        INSERT INTO pain_points
        (id, post_id, source_text, pain_point, category, track_relevance,
         severity_score, frequency_indicator, caregiver_type, care_recipient)
        VALUES (?, 'p1', 'excerpt text', 'caregiver is exhausted', 'emotional_burden',
                'T1', 4, 'recurring', 'family', 'elderly_general')
    """, (str(uuid.uuid4()),))
    conn.execute("""
        INSERT INTO quotes (id, post_id, quote, context, track_relevance, theme, quality_score)
        VALUES (?, 'p1', 'I am so tired', 'caregiver context', 'T1', 'exhaustion', 5)
    """, (str(uuid.uuid4()),))
    return conn

def test_embed_pain_points_populates_chroma(tmp_path):
    conn = setup_db_with_data(tmp_path)
    from src.embedder import embed_pain_points
    from src.db import get_chroma
    client = get_chroma()
    embed_pain_points(conn, client)
    count = client.get_collection("pain_points").count()
    assert count >= 1

def test_embed_quotes_populates_chroma(tmp_path):
    conn = setup_db_with_data(tmp_path)
    from src.embedder import embed_quotes
    from src.db import get_chroma
    client = get_chroma()
    embed_quotes(conn, client)
    count = client.get_collection("quotes").count()
    assert count >= 1

def test_embed_idempotent(tmp_path):
    conn = setup_db_with_data(tmp_path)
    from src.embedder import embed_pain_points
    from src.db import get_chroma
    client = get_chroma()
    embed_pain_points(conn, client)
    embed_pain_points(conn, client)  # second run — must not duplicate
    count = client.get_collection("pain_points").count()
    assert count == 1

def test_embed_pain_points_carries_real_source(tmp_path):
    conn = setup_db_with_data(tmp_path)
    from src.embedder import embed_pain_points
    from src.db import get_chroma
    client = get_chroma()
    embed_pain_points(conn, client)
    col = client.get_collection("pain_points")
    meta = col.get()["metadatas"][0]
    assert meta["source"] == "reddit"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_embedder.py -v
```

- [ ] **Step 3: Write `src/embedder.py`**

```python
import logging
import os
from tqdm import tqdm
import chromadb
import duckdb
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)
MODEL_NAME = "all-mpnet-base-v2"
BATCH_SIZE = 64

_model: SentenceTransformer | None = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info(f"[embedder] loading model {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def _existing_ids(col: chromadb.Collection) -> set[str]:
    if col.count() == 0:
        return set()
    return set(col.get()["ids"])

def _encode_batch(texts: list[str]) -> list[list[float]]:
    model = get_model()
    return model.encode(texts, batch_size=BATCH_SIZE, show_progress_bar=False).tolist()

def embed_pain_points(conn: duckdb.DuckDBPyConnection, client: chromadb.ClientAPI):
    col = client.get_or_create_collection("pain_points")
    existing = _existing_ids(col)

    rows = conn.execute("""
        SELECT pp.id, pp.post_id, pp.pain_point, pp.source_text, pp.category,
               pp.track_relevance, pp.severity_score, pp.frequency_indicator,
               pp.caregiver_type, pp.care_recipient, p.source
        FROM pain_points pp
        JOIN posts p ON p.id = pp.post_id
    """).fetchall()

    new_rows = [r for r in rows if r[0] not in existing]
    if not new_rows:
        logger.info("[embedder] pain_points: nothing new to embed")
        return

    texts = [f"{r[2]}. {r[3]}" for r in new_rows]
    embeddings = _encode_batch(texts)

    col.add(
        ids=[r[0] for r in new_rows],
        embeddings=embeddings,
        documents=texts,
        metadatas=[{
            "duckdb_id": r[0], "post_id": r[1],
            "source": r[10] or "unknown",
            "track_relevance": r[5] or "both",
            "caregiver_type": r[8] or "unclear",
            "care_recipient": r[9] or "unclear",
            "category": r[4] or "other",
            "severity_score": r[6] or 3,
            "frequency_indicator": r[7] or "isolated",
        } for r in new_rows],
    )
    logger.info(f"[embedder] pain_points: embedded {len(new_rows)} new")

def embed_quotes(conn: duckdb.DuckDBPyConnection, client: chromadb.ClientAPI):
    col = client.get_or_create_collection("quotes")
    existing = _existing_ids(col)

    rows = conn.execute("""
        SELECT q.id, q.post_id, q.quote, q.context, q.track_relevance,
               q.theme, q.quality_score, p.source
        FROM quotes q
        JOIN posts p ON p.id = q.post_id
    """).fetchall()

    new_rows = [r for r in rows if r[0] not in existing]
    if not new_rows:
        return

    texts = [f"{r[2]} [{r[3]}]" for r in new_rows]
    embeddings = _encode_batch(texts)

    col.add(
        ids=[r[0] for r in new_rows],
        embeddings=embeddings,
        documents=texts,
        metadatas=[{
            "duckdb_id": r[0], "post_id": r[1],
            "source": r[7] or "unknown",
            "track_relevance": r[4] or "both",
            "caregiver_type": "unclear",
            "care_recipient": "unclear",
            "theme": r[5] or "",
            "quality_score": r[6] or 3,
        } for r in new_rows],
    )
    logger.info(f"[embedder] quotes: embedded {len(new_rows)} new")

def embed_theme_summaries(conn: duckdb.DuckDBPyConnection, client: chromadb.ClientAPI):
    col = client.get_or_create_collection("theme_summaries")
    existing = _existing_ids(col)

    rows = conn.execute("""
        SELECT theme, description, application_angle, track_relevance, post_count, avg_severity
        FROM theme_summaries
    """).fetchall()

    new_rows = [r for r in rows if r[0] not in existing]
    if not new_rows:
        return

    texts = [f"{r[0]}. {r[1]}. {r[2]}" for r in new_rows]
    embeddings = _encode_batch(texts)

    col.add(
        ids=[r[0] for r in new_rows],
        embeddings=embeddings,
        documents=texts,
        metadatas=[{
            "duckdb_id": r[0], "post_id": "",
            "source": "synthesized",
            "track_relevance": r[3] or "both",
            "caregiver_type": "unclear",
            "care_recipient": "unclear",
            "post_count": r[4] or 0,
            "avg_severity": r[5] or 0.0,
        } for r in new_rows],
    )
    logger.info(f"[embedder] theme_summaries: embedded {len(new_rows)} new")

def embed_post_chunks(conn: duckdb.DuckDBPyConnection, client: chromadb.ClientAPI):
    """Embeds normalized_body chunks. Chunk IDs are post_id::chunk_index."""
    from src.processor import normalize_text, chunk_text

    col = client.get_or_create_collection("post_chunks")
    existing = _existing_ids(col)

    rows = conn.execute(
        "SELECT id, source, normalized_body FROM posts WHERE is_processed = TRUE"
    ).fetchall()

    ids, texts, metas = [], [], []
    for post_id, source, normalized_body in rows:
        if not normalized_body:
            continue
        for i, chunk in enumerate(chunk_text(normalized_body)):
            cid = f"{post_id}::{i}"
            if cid in existing:
                continue
            ids.append(cid)
            texts.append(chunk)
            metas.append({
                "duckdb_id": cid, "post_id": post_id,
                "source": source or "unknown",
                "track_relevance": "both",
                "caregiver_type": "unclear",
                "care_recipient": "unclear",
                "chunk_index": i,
                "word_count": len(chunk.split()),
            })

    if not ids:
        return

    for i in range(0, len(ids), BATCH_SIZE):
        batch_texts = texts[i:i + BATCH_SIZE]
        embeddings = _encode_batch(batch_texts)
        col.add(
            ids=ids[i:i + BATCH_SIZE],
            embeddings=embeddings,
            documents=batch_texts,
            metadatas=metas[i:i + BATCH_SIZE],
        )
    logger.info(f"[embedder] post_chunks: embedded {len(ids)} chunks")

def embed_all(conn: duckdb.DuckDBPyConnection, client: chromadb.ClientAPI):
    embed_pain_points(conn, client)
    embed_quotes(conn, client)
    embed_theme_summaries(conn, client)
    embed_post_chunks(conn, client)

def run():
    from src.db import get_duck, get_chroma, init_db
    init_db()
    conn = get_duck()
    client = get_chroma()
    embed_all(conn, client)
    for name in ("pain_points", "quotes", "theme_summaries", "post_chunks"):
        print(f"{name}: {client.get_collection(name).count()}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_embedder.py -v
```
Expected: 4 PASSED (note: first run downloads ~420MB model)

- [ ] **Step 5: Commit**

```bash
git add src/embedder.py tests/test_embedder.py
git commit -m "feat: embedder for all 4 chroma collections"
```

---

### Task 8: Wire semantic search in `query.py`

The `search` command was fully written in Task 6 including the `count == 0` per-collection guard. Verify it works end-to-end.

- [ ] **Step 1: Run embedder on existing data**

```bash
python src/embedder.py
```

- [ ] **Step 2: Verify collections are populated**

```python
import chromadb, os
from dotenv import load_dotenv
load_dotenv()
client = chromadb.PersistentClient(path=os.environ["CHROMA_PATH"])
for name in ("pain_points", "quotes", "theme_summaries", "post_chunks"):
    print(name, client.get_collection(name).count())
```

- [ ] **Step 3: Test semantic search**

```bash
python query.py search "caregiver feels alone at night"
python query.py search "scheduling chaos" --track T2
python query.py search "dementia wandering" --collection quotes
```
Expected: formatted results with relevant content, no errors

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: semantic search end-to-end verified"
```

---

## Chunk 4: Scale, synthesis, reports, orchestrator

### Task 9: Scale `collector.py` — all sources

**Files:**
- Modify: `src/collector.py` — add `AgingCareCollector`, expand Reddit subreddits

> **AgingCare CSS selectors:** The selectors below are starting guesses. Before committing to them, Step 1 requires a live DOM inspection. The scraper must log a warning (not silently succeed) when zero threads are found on a page, so selector drift is immediately visible.

- [ ] **Step 1: Verify AgingCare DOM selectors before writing the collector**

```bash
python3 -c "
import requests
from bs4 import BeautifulSoup
resp = requests.get('https://www.agingcare.com/caregiver-forum', headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
soup = BeautifulSoup(resp.text, 'lxml')
# Try candidate selectors and print what they find:
for sel in ['a.thread-title', 'a.forum-topic-title', 'h3 a', '.topic-title a', 'a[href*=\"/discussions/\"]']:
    found = soup.select(sel)
    print(f'{sel!r}: {len(found)} matches')
    if found:
        print(f'  sample: {found[0].get_text(strip=True)[:80]}')
"
```

Update the selector string in Step 2 based on what actually matches.

- [ ] **Step 2: Expand Reddit subreddits and add `AgingCareCollector`**

Expand the `run()` function and add:

```python
ALL_SUBREDDITS = [
    "AgingParents", "dementia", "caregivers", "caregiving",
    "eldercare", "CNA", "homecare", "DirectCare"
]

class AgingCareCollector:
    BASE_URL = "https://www.agingcare.com/caregiver-forum"
    CATEGORIES = [
        "caregiver-support", "alzheimers-dementia-caregiving",
        "in-home-care", "caregiver-burnout"
    ]
    # UPDATE THIS after running Step 1 DOM inspection:
    THREAD_SELECTOR = "a.thread-title, a.forum-topic-title"
    BODY_SELECTOR = ".post-body, .forum-post-content, article"

    def collect(self) -> int:
        from src.db import get_duck, init_db
        init_db()
        conn = get_duck()
        key = "agingcare"
        seen = load_checkpoint(key)
        new_ids: set[str] = set()

        for cat in self.CATEGORIES:
            url = f"{self.BASE_URL}/{cat}"
            try:
                posts = self._scrape_category(url, seen)
                if not posts:
                    logger.warning(f"[collector] AgingCare {cat}: 0 posts scraped — verify selectors")
                for post in posts:
                    self._write_post(conn, post)
                    new_ids.add(post["id"])
            except Exception as e:
                logger.warning(f"[collector] AgingCare {cat} failed: {e}")

        seen |= new_ids
        save_checkpoint(key, seen)
        logger.info(f"[collector] agingcare: {len(new_ids)} new posts")
        return len(new_ids)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    def _scrape_category(self, url: str, seen: set[str]) -> list[dict]:
        import time
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        threads = soup.select(self.THREAD_SELECTOR)[:50]
        posts = []
        for thread in threads:
            href = thread.get("href", "")
            post_id = f"ac_{abs(hash(href))}"
            if post_id in seen:
                continue
            time.sleep(1.5)
            try:
                t_resp = requests.get(
                    href if href.startswith("http") else f"https://www.agingcare.com{href}",
                    headers={"User-Agent": "Mozilla/5.0"}, timeout=15
                )
                t_soup = BeautifulSoup(t_resp.text, "lxml")
                body_el = t_soup.select_one(self.BODY_SELECTOR)
                body = body_el.get_text(" ", strip=True) if body_el else ""
                if body:
                    posts.append({
                        "id": post_id, "title": thread.get_text(strip=True),
                        "body": body, "url": href, "author": "agingcare_user",
                    })
            except Exception as e:
                logger.debug(f"[collector] thread fetch failed: {e}")
        return posts

    def _write_post(self, conn, post: dict):
        conn.execute("""
            INSERT OR IGNORE INTO posts
            (id, source, subreddit, url, title, body, author, created_at,
             score, num_comments, word_count)
            VALUES (?, 'agingcare', NULL, ?, ?, ?, ?, now(), 0, 0, ?)
        """, (post["id"], post["url"], post["title"], post["body"],
              post["author"], len(post["body"].split())))
```

- [ ] **Step 3: Run full collection**

```bash
python src/collector.py
```
Expected: posts logged per source, checkpoint state saved

- [ ] **Step 4: Verify counts**

```bash
python query.py stats
```

- [ ] **Step 5: Run full pipeline from process stage**

```bash
python src/processor.py
python src/analyzer.py  # live API calls — ~$15-40 total
python src/embedder.py
```

- [ ] **Step 6: Commit**

```bash
git add src/collector.py
git commit -m "feat: expand collector to all subreddits + agingcare scraper"
```

---

### Task 10: `synthesizer.py` — Theme aggregation + Claude narrative framing

**Files:**
- Create: `src/synthesizer.py`
- Create: `tests/test_synthesizer.py`

> **Notes:** `STRING_AGG(pain_point, '||')` requires the explicit delimiter — calling `STRING_AGG(col)` without one raises a DuckDB binding error. Theme keys are constructed as `f"{category}_{track}"` (e.g., `emotional_burden_T1`). Categories in the schema use only lowercase letters and underscores; track values are the fixed set `{T1, T2, both}`. No collision is possible with this character set.

> **`--dry-run` note:** Running `run_pipeline.py --dry-run` on a freshly-collected database skips `synthesize` and `report` (no Claude calls). The expected end state is: posts collected and processed, dry-run mock pain_points and quotes written, no theme_summaries or reports. This is by design — dry-run validates plumbing, not analysis quality.

- [ ] **Step 1: Write failing tests**

```python
# tests/test_synthesizer.py
import os, uuid, pytest
from unittest.mock import patch

MOCK_SYNTHESIS = {"description": "Caregivers report exhaustion.", "application_angle": "Supports grant narrative."}

def setup_db(tmp_path):
    os.environ["DUCKDB_PATH"] = str(tmp_path / "test.duckdb")
    os.environ["CHROMA_PATH"] = str(tmp_path / "chroma")
    from src.db import init_db, get_duck
    init_db()
    conn = get_duck()
    conn.execute("""
        INSERT INTO posts (id, source, subreddit, url, title, body, author,
                           created_at, score, num_comments, word_count)
        VALUES ('p1', 'reddit', 'AgingParents', 'http://x', 'T', 'b', 'u', now(), 0, 0, 1)
    """)
    for i in range(6):
        conn.execute("""
            INSERT INTO pain_points
            (id, post_id, source_text, pain_point, category, track_relevance,
             severity_score, frequency_indicator, caregiver_type, care_recipient)
            VALUES (?, 'p1', 'ex', ?, 'emotional_burden', 'T1', 4, 'recurring', 'family', 'dementia')
        """, (str(uuid.uuid4()), f"pain point {i}"))
    return conn

def test_synthesize_writes_theme(tmp_path):
    conn = setup_db(tmp_path)
    from src.synthesizer import synthesize
    with patch("src.synthesizer.call_claude_synthesis", return_value=MOCK_SYNTHESIS):
        synthesize(conn)
    count = conn.execute("SELECT COUNT(*) FROM theme_summaries").fetchone()[0]
    assert count >= 1

def test_synthesize_skips_small_categories(tmp_path):
    conn = setup_db(tmp_path)
    for i in range(2):
        conn.execute("""
            INSERT INTO pain_points
            (id, post_id, source_text, pain_point, category, track_relevance,
             severity_score, frequency_indicator, caregiver_type, care_recipient)
            VALUES (?, 'p1', 'ex', ?, 'financial', 'T1', 2, 'isolated', 'family', 'unclear')
        """, (str(uuid.uuid4()), f"finance pain {i}"))
    from src.synthesizer import synthesize
    with patch("src.synthesizer.call_claude_synthesis", return_value=MOCK_SYNTHESIS):
        synthesize(conn)
    rows = conn.execute("SELECT theme FROM theme_summaries").fetchall()
    themes = [r[0] for r in rows]
    assert not any("financial" in t for t in themes)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_synthesizer.py -v
```

- [ ] **Step 3: Write `src/synthesizer.py`**

```python
import json
import logging
import os
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv
import duckdb

load_dotenv()
logger = logging.getLogger(__name__)

MIN_PAIN_POINTS = 5
MODEL = "claude-sonnet-4-6"

@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=4, max=60))
def call_claude_synthesis(category: str, track: str, pain_points: list[str]) -> dict:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    prompt = (
        f'Given these {len(pain_points)} pain points in the category "{category}" '
        f'(track: {track}) from caregiver community posts, write:\n'
        '1. A 2-sentence description of this theme\n'
        '2. A 2-sentence "application_angle" — how to frame this compellingly in a '
        'federal grant application for an AI caregiving tool\n\n'
        f'Pain points:\n' + "\n".join(f"- {p}" for p in pain_points) +
        '\n\nRespond as JSON: {"description": "...", "application_angle": "..."}'
    )
    msg = client.messages.create(
        model=MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    try:
        return json.loads(msg.content[0].text)
    except json.JSONDecodeError:
        return {"description": "", "application_angle": ""}

def synthesize(conn: duckdb.DuckDBPyConnection):
    rows = conn.execute("""
        SELECT category, track_relevance,
               COUNT(*) as n,
               ROUND(AVG(severity_score), 2) as avg_sev,
               STRING_AGG(pain_point, '||') as pain_points_concat
        FROM pain_points
        GROUP BY category, track_relevance
        HAVING COUNT(*) >= ?
    """, (MIN_PAIN_POINTS,)).fetchall()

    for category, track, n, avg_sev, pain_points_concat in rows:
        pain_points = pain_points_concat.split("||")[:20]

        quote_row = conn.execute("""
            SELECT q.quote FROM quotes q
            JOIN pain_points pp ON pp.post_id = q.post_id
            WHERE pp.category = ? AND q.quality_score >= 4
            ORDER BY q.quality_score DESC LIMIT 1
        """, (category,)).fetchone()
        sample_quote = quote_row[0] if quote_row else ""

        synthesis = call_claude_synthesis(category, track, pain_points)

        theme_key = f"{category}_{track}"
        conn.execute("""
            INSERT OR REPLACE INTO theme_summaries
            (theme, description, post_count, avg_severity, track_relevance,
             top_categories, sample_quote, application_angle)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            theme_key, synthesis.get("description", ""),
            n, avg_sev, track, category, sample_quote,
            synthesis.get("application_angle", ""),
        ))
        logger.info(f"[synthesizer] theme: {theme_key} ({n} pain points)")

def run():
    from src.db import get_duck, init_db
    init_db()
    conn = get_duck()
    synthesize(conn)
    count = conn.execute("SELECT COUNT(*) FROM theme_summaries").fetchone()[0]
    print(f"theme_summaries: {count} themes written")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_synthesizer.py -v
```
Expected: 2 PASSED

- [ ] **Step 5: Commit**

```bash
git add src/synthesizer.py tests/test_synthesizer.py
git commit -m "feat: synthesizer — theme aggregation + Claude narrative framing"
```

---

### Task 11: `report.py` — Markdown reports

**Files:**
- Create: `src/report.py`

- [ ] **Step 1: Write `src/report.py`**

```python
import logging
import os
from pathlib import Path
import duckdb

logger = logging.getLogger(__name__)
REPORTS_DIR = Path("reports")

def generate_track_report(conn: duckdb.DuckDBPyConnection, track: str) -> str:
    lines = [f"# Caregiver Research Insights — {track}\n"]

    n_pp = conn.execute(
        "SELECT COUNT(*) FROM pain_points WHERE track_relevance IN ('both', ?)", (track,)
    ).fetchone()[0]
    lines.append(f"**Total pain points:** {n_pp}\n")

    lines.append("## Top Categories\n")
    cats = conn.execute("""
        SELECT category, COUNT(*) as n, ROUND(AVG(severity_score),2) as avg_sev
        FROM pain_points WHERE track_relevance IN ('both', ?)
        GROUP BY category ORDER BY n DESC LIMIT 8
    """, (track,)).fetchall()
    for cat, n, sev in cats:
        lines.append(f"- **{cat}**: {n} pain points (avg severity {sev})")

    lines.append("\n## Themes\n")
    themes = conn.execute("""
        SELECT theme, description, post_count, avg_severity, application_angle, sample_quote
        FROM theme_summaries WHERE track_relevance IN ('both', ?)
        ORDER BY post_count DESC
    """, (track,)).fetchall()
    for theme, desc, pc, avg_sev, angle, quote in themes:
        lines.append(f"### {theme}")
        lines.append(f"{desc}\n")
        lines.append(f"**Grant angle:** {angle}\n")
        lines.append(f"> {quote}\n")

    lines.append("## Top Pain Points (by severity)\n")
    pps = conn.execute("""
        SELECT pain_point, category, severity_score, caregiver_type,
               care_recipient, source_text
        FROM pain_points WHERE track_relevance IN ('both', ?)
        ORDER BY severity_score DESC LIMIT 20
    """, (track,)).fetchall()
    for pp, cat, sev, ctype, recipient, excerpt in pps:
        lines.append(f"### [{cat}] severity:{sev} | {ctype} | {recipient}")
        lines.append(f"**{pp}**\n_{excerpt}_\n")

    lines.append("## Caregiver Voices (quality score 5)\n")
    quotes = conn.execute("""
        SELECT quote, context, theme FROM quotes
        WHERE track_relevance IN ('both', ?) AND quality_score = 5
        ORDER BY theme LIMIT 15
    """, (track,)).fetchall()
    for quote, ctx, theme in quotes:
        lines.append(f"> \"{quote}\"\n— *{ctx}* [{theme}]\n")

    return "\n".join(lines)

def generate_combined_report(conn: duckdb.DuckDBPyConnection) -> str:
    lines = ["# Combined Research Insights — T1 vs T2\n"]

    for track in ("T1", "T2", "both"):
        n = conn.execute(
            "SELECT COUNT(*) FROM pain_points WHERE track_relevance = ?", (track,)
        ).fetchone()[0]
        lines.append(f"- **{track}**: {n} pain points")

    lines.append("\n## Dual-Tagged Pain Points (both T1 and T2)\n")
    dual = conn.execute("""
        SELECT pain_point, category, severity_score, track1_signal, track2_signal
        FROM pain_points WHERE track_relevance = 'both'
        ORDER BY severity_score DESC LIMIT 20
    """).fetchall()
    for pp, cat, sev, t1, t2 in dual:
        lines.append(f"### [{cat}] sev:{sev}")
        lines.append(f"**{pp}**")
        lines.append(f"T1: {t1}")
        lines.append(f"T2: {t2}\n")

    return "\n".join(lines)

def generate_source_report(conn: duckdb.DuckDBPyConnection) -> str:
    lines = ["# Source Breakdown\n"]
    rows = conn.execute("""
        SELECT source, subreddit, COUNT(*) as posts
        FROM posts GROUP BY source, subreddit ORDER BY posts DESC
    """).fetchall()
    for source, sub, n in rows:
        lines.append(f"- {source}/{sub or 'N/A'}: {n} posts")
    return "\n".join(lines)

def run():
    from src.db import get_duck, init_db
    init_db()
    conn = get_duck()
    REPORTS_DIR.mkdir(exist_ok=True)

    for track in ("T1", "T2"):
        path = REPORTS_DIR / f"insights_{track.lower()}.md"
        path.write_text(generate_track_report(conn, track))
        logger.info(f"[report] wrote {path}")

    (REPORTS_DIR / "insights_combined.md").write_text(generate_combined_report(conn))
    (REPORTS_DIR / "source_breakdown.md").write_text(generate_source_report(conn))
    print(f"Reports written to {REPORTS_DIR}/")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
```

- [ ] **Step 2: Run report generator**

```bash
python src/report.py
```
Expected: 4 files written to `reports/`

- [ ] **Step 3: Verify reports look useful**

```bash
open reports/insights_combined.md
```
Check: reads like a research document, not a data dump

- [ ] **Step 4: Commit**

```bash
git add src/report.py
git commit -m "feat: markdown report generation for T1, T2, combined, source"
```

---

### Task 12: `run_pipeline.py` — Orchestrator

**Files:**
- Create: `run_pipeline.py`

- [ ] **Step 1: Write `run_pipeline.py`**

```python
#!/usr/bin/env python3
import argparse
import logging
import sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

STAGES = ["collect", "process", "analyze", "synthesize", "embed", "report"]

def run_collect(dry_run: bool):
    from src.collector import RedditCollector
    ALL_SUBREDDITS = [
        "AgingParents", "dementia", "caregivers", "caregiving",
        "eldercare", "CNA", "homecare", "DirectCare"
    ]
    collector = RedditCollector(subreddits=ALL_SUBREDDITS, post_limit=500)
    n = collector.collect()
    logger.info(f"[pipeline] collected {n} new posts")

def run_process(dry_run: bool):
    from src.processor import process_posts
    from src.db import get_duck, init_db
    init_db()
    posts = process_posts(get_duck())
    logger.info(f"[pipeline] processed {len(posts)} posts")

def run_analyze(dry_run: bool):
    from src.analyzer import run_analysis
    from src.db import get_duck, init_db
    init_db()
    run_analysis(get_duck(), dry_run=dry_run)

def run_synthesize(dry_run: bool):
    if dry_run:
        logger.info("[pipeline] skipping synthesize (dry-run)")
        return
    from src.synthesizer import synthesize
    from src.db import get_duck, init_db
    init_db()
    synthesize(get_duck())

def run_embed(dry_run: bool):
    if dry_run:
        logger.info("[pipeline] skipping embed (dry-run)")
        return
    from src.embedder import embed_all
    from src.db import get_duck, get_chroma, init_db
    init_db()
    embed_all(get_duck(), get_chroma())

def run_report(dry_run: bool):
    if dry_run:
        logger.info("[pipeline] skipping report (dry-run)")
        return
    from src.report import run
    run()

RUNNERS = {
    "collect": run_collect,
    "process": run_process,
    "analyze": run_analyze,
    "synthesize": run_synthesize,
    "embed": run_embed,
    "report": run_report,
}

def main():
    parser = argparse.ArgumentParser(description="Caregiver mining pipeline")
    parser.add_argument("--stage", choices=STAGES, help="Run a single stage")
    parser.add_argument("--from", dest="from_stage", choices=STAGES,
                        help="Resume from this stage")
    parser.add_argument("--dry-run", action="store_true",
                        help="Skip Claude API and embedding calls (collect+process still run)")
    args = parser.parse_args()

    if args.stage:
        stages_to_run = [args.stage]
    elif args.from_stage:
        start = STAGES.index(args.from_stage)
        stages_to_run = STAGES[start:]
    else:
        stages_to_run = STAGES

    for stage in stages_to_run:
        logger.info(f"[pipeline] ── {stage} ──")
        RUNNERS[stage](dry_run=args.dry_run)

    logger.info("[pipeline] done.")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test dry-run end-to-end**

```bash
python run_pipeline.py --dry-run
```
Expected: collect + process run normally; analyze writes mock rows; synthesize/embed/report skipped

- [ ] **Step 3: Test `--from` flag**

```bash
python run_pipeline.py --from analyze --dry-run
```
Expected: skips collect and process, runs analyze through report

- [ ] **Step 4: Final commit**

```bash
git add run_pipeline.py
git commit -m "feat: pipeline orchestrator with --stage, --from, --dry-run"
```

---

## Validation Queries (Post-Step 9)

Run these in Python to sanity-check data quality before writing the application:

```python
import duckdb, os
from dotenv import load_dotenv
load_dotenv()

conn = duckdb.connect(os.environ["DUCKDB_PATH"])

print(conn.execute("""
    SELECT track_relevance, COUNT(*) as n, ROUND(AVG(severity_score), 2) as avg_severity
    FROM pain_points GROUP BY track_relevance ORDER BY n DESC
""").df())

print(conn.execute("""
    SELECT category, COUNT(*) as n FROM pain_points
    GROUP BY category ORDER BY n DESC LIMIT 10
""").df())

print(conn.execute("""
    SELECT quote, context, theme, track_relevance
    FROM quotes WHERE quality_score = 5
    ORDER BY track_relevance, theme LIMIT 10
""").df())
```
