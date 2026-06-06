# Caregiver AI Challenge — Data Mining System

## Claude Code Project Spec v2

---

## Project Goal

Build a data mining, analysis, and retrieval pipeline that:

1. Collects posts from caregiver communities online
2. Analyzes them through two lenses (Track 1: caregiver experience; Track 2: workforce/org efficiency)
3. Stores structured insights in DuckDB (analytical queries)
4. Stores semantic embeddings in ChromaDB (fuzzy retrieval)
5. Exposes a query interface so Claude can retrieve relevant insights during brainstorming and application writing sessions

The system should remain track-agnostic at collection time — the same raw data feeds both analytical lenses simultaneously.

---

## Background Context

The ACL (Administration for Community Living) Caregiver AI Challenge has two tracks:

- **Track 1**: AI tools that directly support individual caregivers (family or paid) in their day-to-day work
- **Track 2**: AI tools that help organizations (home care agencies, state programs, co-ops) extend and improve the direct care workforce

Both tracks are being explored. The research goal is to surface real pain points from real caregivers to (a) identify the most compelling use cases, (b) decide which track(s) to apply to, and (c) provide evidence-backed insights for the application narrative.

---

## Architecture Overview

```
[Sources: Reddit, AgingCare.com, care worker forums]
                    ↓
         [collector.py — PRAW / HTML scrapers]
                    ↓
         [processor.py — deduplicate, normalize, chunk]
                    ↓
         [analyzer.py — Claude API, dual-lens extraction]
              ↙              ↘
    [Track 1 lens]      [Track 2 lens]
              ↘              ↙
         ┌────────────────────────┐
         │   DuckDB (.duckdb)     │  ← structured, analytical
         │   posts, pain_points,  │
         │   quotes, themes       │
         └────────────────────────┘
                    ↓
         [embedder.py — sentence-transformers]
                    ↓
         ┌────────────────────────┐
         │   ChromaDB (./chroma)  │  ← semantic, fuzzy retrieval
         │   4 collections        │
         └────────────────────────┘
                    ↓
         [query.py — CLI retrieval interface]
                    ↓
         [Paste context into Claude sessions]
```

---

## Data Sources

### Reddit (primary)

Target subreddits, in priority order:

| Subreddit      | Focus                               | Track signal |
| -------------- | ----------------------------------- | ------------ |
| r/AgingParents | Family caregivers of aging parents  | T1 primary   |
| r/dementia     | Dementia-specific caregiving        | T1 primary   |
| r/caregivers   | Broad caregiving, venting           | T1           |
| r/caregiving   | Senior-focused                      | T1           |
| r/eldercare    | Informal caregivers of older adults | T1           |
| r/CNA          | Certified nursing assistants        | T2 primary   |
| r/homecare     | Home care workers                   | T2 primary   |
| r/DirectCare   | Direct care workers (verify exists) | T2 primary   |

**Approach**: Use PRAW (Python Reddit API Wrapper) with the official Reddit API. Register a Reddit app at reddit.com/prefs/apps. Fetch `hot` and `top` (past year) posts plus top-level comments. Target 500–2000 posts per subreddit.

Fallback: If Reddit API is rate-limited or unavailable, scrape `old.reddit.com` via `requests` + `BeautifulSoup`. Do not use Pushshift (deprecated).

### AgingCare.com Forums

URL: `https://www.agingcare.com/caregiver-forum`

Long-running elder care forum, highly active, candid discussions. Scrape using `requests` + `BeautifulSoup`. Target categories: general caregiving, Alzheimer's/dementia, in-home care, caregiver burnout. Respect `robots.txt` and add 1–2 second delays between requests.

### Direct Care Worker Forums

Evaluate and scrape the most active of:

- r/CNA, r/homecare, r/DirectCare on Reddit
- Any active public web forums for home health aides or direct support professionals

Focus signal: scheduling frustrations, documentation burden, agency communication, training gaps, turnover reasons.

---

## Tech Stack

```
praw                    # Reddit API
requests                # HTTP
beautifulsoup4          # HTML parsing
lxml                    # HTML parser backend
anthropic               # Claude API for analysis
duckdb                  # Structured insight storage
chromadb                # Vector embedding storage
sentence-transformers   # Local embedding model
tenacity                # Retry / exponential backoff
python-dotenv           # .env config
tqdm                    # Progress bars
```

**Embedding model**: `all-mpnet-base-v2` via `sentence-transformers`. Better domain coverage than the ChromaDB default (`all-MiniLM-L6-v2`) for nuanced caregiver language. Downloads automatically on first run (~420MB). Swappable via config.

**Claude model**: `claude-sonnet-4-20250514` for all analysis calls.

**Config**: `.env` file. Required keys:

```
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=caregiver-mining/1.0
ANTHROPIC_API_KEY=
DUCKDB_PATH=./data/insights.duckdb
CHROMA_PATH=./data/chroma
```

**Checkpointing**: `.mining_state.json` tracks collected post IDs and analysis status per source, enabling fully resumable runs.

---

## DuckDB Schema

```sql
CREATE TABLE posts (
    id VARCHAR PRIMARY KEY,
    source VARCHAR,              -- 'reddit', 'agingcare', 'directcare_forum'
    subreddit VARCHAR,
    url VARCHAR,
    title VARCHAR,
    body TEXT,
    author VARCHAR,
    created_at TIMESTAMP,
    score INTEGER,
    num_comments INTEGER,
    word_count INTEGER,
    collected_at TIMESTAMP DEFAULT now()
);

CREATE TABLE comments (
    id VARCHAR PRIMARY KEY,
    post_id VARCHAR REFERENCES posts(id),
    body TEXT,
    author VARCHAR,
    score INTEGER,
    created_at TIMESTAMP
);

CREATE TABLE pain_points (
    id VARCHAR PRIMARY KEY,          -- uuid4
    post_id VARCHAR,
    source_text TEXT,                -- excerpt anchoring the pain point
    pain_point TEXT,                 -- concise description
    category VARCHAR,                -- 'communication' | 'scheduling' | 'documentation'
                                     -- 'emotional_burden' | 'coordination' | 'training'
                                     -- 'health_monitoring' | 'financial' | 'other'
    track_relevance VARCHAR,         -- 'T1' | 'T2' | 'both'
    track1_signal TEXT,              -- how this maps to T1 (nullable)
    track2_signal TEXT,              -- how this maps to T2 (nullable)
    severity_score INTEGER,          -- 1–5
    frequency_indicator VARCHAR,     -- 'isolated' | 'recurring' | 'widespread'
    caregiver_type VARCHAR,          -- 'family' | 'paid_direct_care' | 'agency' | 'unclear'
    care_recipient VARCHAR,          -- 'elderly_general' | 'dementia' | 'IDD' | 'other' | 'unclear'
    extracted_at TIMESTAMP DEFAULT now()
);

CREATE TABLE quotes (
    id VARCHAR PRIMARY KEY,
    post_id VARCHAR,
    quote TEXT,
    context TEXT,
    track_relevance VARCHAR,
    theme VARCHAR,
    quality_score INTEGER            -- 1–5
);

CREATE TABLE theme_summaries (
    theme VARCHAR PRIMARY KEY,
    description TEXT,
    post_count INTEGER,
    avg_severity FLOAT,
    track_relevance VARCHAR,
    top_categories VARCHAR,          -- comma-separated
    sample_quote TEXT,
    application_angle TEXT           -- grant narrative framing
);
```

---

## ChromaDB Collections

Four collections, each serving a different retrieval purpose. Every document carries metadata enabling hybrid retrieval (semantic similarity + structured filter).

**Shared metadata fields on all documents**:

```python
metadata = {
    "duckdb_id": str,
    "post_id": str,
    "source": str,              # 'reddit' | 'agingcare' | 'directcare_forum'
    "track_relevance": str,     # 'T1' | 'T2' | 'both'
    "caregiver_type": str,
    "care_recipient": str,
    # collection-specific fields below
}
```

### Collection: `pain_points`

- **Embedded text**: `f"{pain_point}. {source_text}"`
- **Extra metadata**: `category`, `severity_score`, `frequency_indicator`
- **Use**: "Find pain points related to X" — primary retrieval collection

### Collection: `quotes`

- **Embedded text**: `f"{quote} [{context}]"`
- **Extra metadata**: `theme`, `quality_score`
- **Use**: "Find caregiver voices that express Y" — primary for narrative writing

### Collection: `theme_summaries`

- **Embedded text**: `f"{theme}. {description}. {application_angle}"`
- **Extra metadata**: `post_count`, `avg_severity`
- **Use**: "What themes connect to this product idea?" — high-level brainstorming

### Collection: `post_chunks`

- **Embedded text**: Raw normalized post text, ~400 words with 100-word overlap
- **Extra metadata**: `chunk_index`, `word_count`
- **Use**: Open-ended retrieval, fallback when other collections don't have enough context

---

## Pipeline Modules

### `collector.py`

One class per source, shared interface:

```python
class BaseCollector:
    def collect(self) -> list[dict]
    def checkpoint_ids(self) -> set[str]
    def save_checkpoint(self, ids: set[str])
```

- `RedditCollector(subreddits, post_limit)` — PRAW
- `AgingCareCollector(categories)` — requests + BS4
- `DirectCareCollector(sources)` — requests + BS4

Each collector writes to DuckDB `posts` and `comments` after each batch. Skips already-checkpointed IDs on re-run.

### `processor.py`

- **Deduplication**: MD5 content hash; jaccard similarity >85% → drop lower-scored duplicate
- **Filtering**: drop posts <50 words, product-rec posts, mod announcements
- **Normalization**: strip markdown, URLs, @mentions, excessive whitespace
- **Caregiver type heuristic**: keyword classifier — family ("my mom", "my parent") vs paid ("my client", "my shift", "my agency")
- **Chunking**: posts >600 words split into ~400-word overlapping chunks for embedding; full text retained in DuckDB

### `analyzer.py`

Batches 5–8 posts per Claude API call.

**System prompt**:

```
You are analyzing posts from caregiver communities to extract structured pain points for
an AI tool design challenge with two tracks:

TRACK 1: AI tools that directly help individual caregivers (family or paid) day-to-day —
reducing burden, improving communication, managing schedules, monitoring health changes,
coordinating with medical providers, supporting caregiver wellbeing.

TRACK 2: AI tools that help ORGANIZATIONS (home care agencies, state programs, co-ops)
extend their direct care workforce — automating documentation, improving scheduling,
supporting recruitment and retention, reducing admin burden, improving training.

For each post extract all specific, concrete pain points. For each identify: which
track(s) and how, severity (1–5), frequency, caregiver type, care recipient type, and
a verbatim source excerpt. Also extract 0–3 high-quality verbatim quotes (1–3 sentences)
that vividly express a pain point in the caregiver's own voice.

Respond ONLY with valid JSON matching the schema. No preamble, no markdown fences.
```

**Response schema**:

```json
{
  "pain_points": [
    {
      "pain_point": "string",
      "category": "communication|scheduling|documentation|emotional_burden|coordination|training|health_monitoring|financial|other",
      "track_relevance": "T1|T2|both",
      "track1_signal": "string or null",
      "track2_signal": "string or null",
      "severity_score": 3,
      "frequency_indicator": "isolated|recurring|widespread",
      "caregiver_type": "family|paid_direct_care|agency|unclear",
      "care_recipient": "elderly_general|dementia|IDD|other|unclear",
      "source_text": "string"
    }
  ],
  "quotes": [
    {
      "quote": "string",
      "context": "string",
      "track_relevance": "T1|T2|both",
      "theme": "string",
      "quality_score": 4
    }
  ]
}
```

- `tenacity` exponential backoff, max 5 retries
- Log token usage per batch to `analysis_log.json`
- Write to DuckDB immediately after each batch

### `embedder.py`

```python
from sentence_transformers import SentenceTransformer
import chromadb

MODEL = "all-mpnet-base-v2"

def embed_all(duckdb_conn, chroma_client):
    embed_pain_points(duckdb_conn, chroma_client)
    embed_quotes(duckdb_conn, chroma_client)
    embed_theme_summaries(duckdb_conn, chroma_client)
    embed_post_chunks(duckdb_conn, chroma_client)
```

- Model loaded once, reused across all collections
- Checks existing Chroma IDs before embedding — idempotent
- Batch size 64 for encoding
- `tqdm` progress bars

### `synthesizer.py`

1. Query DuckDB: group pain_points by category + track, count, average severity
2. For themes with 5+ pain points, call Claude:

```
Given these {n} pain points in the category "{category}" from caregiver community posts,
write:
1. A 2-sentence description of this theme
2. A 2-sentence "application_angle" — how to frame this compellingly in a federal grant
   application for an AI caregiving tool

Pain points: {list}

Respond as JSON: {"description": "...", "application_angle": "..."}
```

3. Write to `theme_summaries`
4. Trigger `embedder.py` to embed new summaries

### `report.py`

Outputs:

- `reports/insights_track1.md` — top pain points, categories, quotes, theme summaries for T1
- `reports/insights_track2.md` — same for T2
- `reports/insights_combined.md` — T1 vs T2 signal strength comparison, dual-tagged pain points, track recommendation
- `reports/source_breakdown.md` — counts by source, caregiver type, care recipient

---

## Query Interface (`query.py`)

CLI for retrieval during Claude brainstorming sessions. Output is clean markdown for copy-paste into conversation.

```bash
# Semantic search across all collections
python query.py search "caregiver feels isolated and overwhelmed"

# Search with track filter
python query.py search "scheduling chaos" --track T2

# Search specific collection
python query.py search "dementia wandering at night" --collection quotes

# Theme overview
python query.py themes --track T1

# Top pain points by category
python query.py top --category emotional_burden --limit 10

# Stats summary
python query.py stats
```

**Output format for `search`**:

```markdown
## Query: "caregiver feels isolated and overwhelmed"

Retrieved 5 results | collections: pain_points, quotes, theme_summaries

---

### [pain_point] severity:4 | T1 | family | dementia

**Pain point**: No support available at 2am during behavioral episodes — caregiver
completely alone managing crisis moments.
**Excerpt**: "I haven't slept more than 3 hours at a time in 6 months..."
**Source**: r/dementia

---

### [quote] quality:5 | T1 | family | elderly_general

**Quote**: "The hardest part isn't the physical work. It's that nobody checks on me.
I could disappear and no one would know."
**Context**: Sole caregiver of elderly parent, no paid support.
**Theme**: caregiver isolation
```

Output is intentionally formatted for direct drop-in to a Claude conversation as retrieval context.

---

## Directory Structure

```
caregiver-mining/
├── .env                        # API keys (gitignored)
├── .mining_state.json          # Checkpoint state (gitignored)
├── requirements.txt
├── README.md
├── data/
│   ├── insights.duckdb
│   └── chroma/
├── reports/
├── src/
│   ├── collector.py
│   ├── processor.py
│   ├── analyzer.py
│   ├── embedder.py
│   ├── synthesizer.py
│   ├── report.py
│   └── db.py                   # DuckDB + ChromaDB connection helpers
├── query.py                    # Top-level for easy CLI access
└── run_pipeline.py             # Orchestrator
```

---

## `run_pipeline.py`

```python
stages = [
    ("collect",    collector.run),
    ("process",    processor.run),
    ("analyze",    analyzer.run),
    ("synthesize", synthesizer.run),
    ("embed",      embedder.run),
    ("report",     report.run),
]
```

```bash
python run_pipeline.py                   # full run
python run_pipeline.py --stage collect   # single stage
python run_pipeline.py --from analyze    # resume from stage
python run_pipeline.py --dry-run         # collect + process only, skip API calls
```

---

## Estimated Scale & Cost

| Source                | Target posts      | Est. pain points   | Est. quotes      |
| --------------------- | ----------------- | ------------------ | ---------------- |
| Reddit (8 subreddits) | 4,000–8,000       | 8,000–20,000       | 1,500–4,000      |
| AgingCare.com         | 500–1,000         | 1,000–3,000        | 200–600          |
| Direct care forums    | 300–600           | 600–1,500          | 100–300          |
| **Total**             | **~5,000–10,000** | **~10,000–25,000** | **~2,000–5,000** |

At ~6 posts per Claude API batch: ~800–1,700 analysis calls.
Estimated cost at claude-sonnet-4 pricing: **$15–40 for full analysis run**.

---

## Implementation Order

Build and validate in the following sequence. Do not proceed to the next step until the
current one is working and tested. Each step has a clear completion criterion.

---

### Step 1 — Project scaffold and `db.py`

**Build**: Directory structure, `requirements.txt`, `.env` loading, `db.py` with
DuckDB schema creation and ChromaDB client initialization.

**Completion criterion**: Running `python src/db.py` creates `data/insights.duckdb`
with all tables and `data/chroma/` directory. Re-running is idempotent (no errors,
no duplicate tables).

---

### Step 2 — `collector.py` (Reddit only)

**Build**: `RedditCollector` using PRAW. Fetch posts + top-level comments from
`r/AgingParents` only. Write to DuckDB `posts` and `comments`. Implement checkpointing.

**Completion criterion**: Running `python src/collector.py` fetches ~50 posts from
`r/AgingParents`, writes them to DuckDB, prints a count summary. Re-running fetches
0 new posts (checkpoint works). Verify rows in DuckDB with a quick `SELECT COUNT(*) FROM posts`.

**Note**: Get Reddit API credentials before starting this step. Register app at
reddit.com/prefs/apps — takes ~5 minutes.

---

### Step 3 — `processor.py`

**Build**: Deduplication, filtering, normalization, caregiver type heuristic, chunking.
Reads from DuckDB `posts`, writes a `processed` flag or separate processed output.

**Completion criterion**: Running `python src/processor.py` on the Step 2 data produces
a clean set of `ProcessedPost` objects. Print a before/after count (how many posts
dropped by each filter). Manually inspect 3–5 processed posts to verify normalization
looks correct.

---

### Step 4 — `analyzer.py` in dry-run mode

**Build**: Full analyzer logic — batching, prompt construction, JSON response parsing,
DuckDB writes — but with a `--dry-run` flag that substitutes a mock Claude response
instead of making real API calls.

**Completion criterion**: `python src/analyzer.py --dry-run` processes all posts from
Step 3, writes mock `pain_points` and `quotes` rows to DuckDB, prints batch count and
row totals. Schema validated. No API calls made.

---

### Step 5 — `analyzer.py` live, small batch

**Build**: Remove dry-run guard, run against real Claude API on a small sample (50 posts
from Step 2 data).

**Completion criterion**: 50 posts analyzed, pain_points and quotes written to DuckDB.
Manually inspect 10–15 extracted pain_points — verify the JSON parsing is clean, track
tags are sensible, severity scores are reasonable. Check `analysis_log.json` for token
usage. Fix any prompt or parsing issues before scaling up.

---

### Step 6 — `query.py` (DuckDB queries only, no Chroma yet)

**Build**: The structured query commands — `stats`, `top`, `themes` — backed by DuckDB
SQL. The `search` command can be stubbed to print "embeddings not yet available".

**Completion criterion**: `python query.py stats` returns a clean summary of post counts,
pain point counts by track, top categories. `python query.py top --category emotional_burden`
returns formatted results. This validates the output format contract before Chroma is wired in.

---

### Step 7 — `embedder.py` and Chroma wiring

**Build**: Full `embedder.py` — load `all-mpnet-base-v2`, embed pain_points and quotes
collections from Step 5 data, write to ChromaDB with metadata.

**Completion criterion**: `python src/embedder.py` completes without error. Verify
ChromaDB collections exist and have the expected document count:

```python
import chromadb
client = chromadb.PersistentClient(path="./data/chroma")
print(client.get_collection("pain_points").count())
print(client.get_collection("quotes").count())
```

---

### Step 8 — `query.py` semantic search

**Build**: Wire the `search` command to ChromaDB. Implement hybrid retrieval (semantic

- metadata filter). Finalize the markdown output format.

**Completion criterion**: `python query.py search "caregiver feels alone at night"`
returns 5 formatted results from ChromaDB. Results are relevant (sanity-check manually).
`--track T1` filter returns only T1/both results. Output format matches spec exactly.

---

### Step 9 — Scale up collection

**Build**: Expand `collector.py` to all 8 Reddit subreddits at full post limits.
Add `AgingCareCollector` and `DirectCareCollector`.

**Completion criterion**: Full collection run completes. Post counts per source logged.
Checkpoint state prevents re-fetching. Run full pipeline (`--from process`) on expanded
data through to embedder. `query.py stats` reflects full dataset.

---

### Step 10 — `synthesizer.py` and `report.py`

**Build**: Theme aggregation, Claude synthesis calls for `application_angle`, markdown
report generation.

**Completion criterion**: `python src/synthesizer.py` populates `theme_summaries` with
at least 5 themes. Reports generated in `reports/`. Open `insights_combined.md` and
verify it reads like a useful research document — not just a data dump.

---

### Step 11 — `run_pipeline.py` orchestrator

**Build**: Wire all stages together with `--stage`, `--from`, and `--dry-run` flags.

**Completion criterion**: `python run_pipeline.py --dry-run` runs end-to-end with no
API calls and no errors. `python run_pipeline.py --from analyze` correctly resumes
mid-pipeline. Full `python run_pipeline.py` run completes cleanly on already-collected data.

---

### Step 12 — Embed remaining collections

**Build**: Add `post_chunks` and `theme_summaries` embedding to `embedder.py`.

**Completion criterion**: All 4 ChromaDB collections populated. `query.py search` draws
from all collections and labels result source correctly.

---

## Validation Queries

After Step 9+, use these DuckDB queries to sanity-check data quality before writing the application:

```sql
-- Track signal distribution
SELECT track_relevance, COUNT(*) as n, ROUND(AVG(severity_score), 2) as avg_severity
FROM pain_points
GROUP BY track_relevance ORDER BY n DESC;

-- Top categories overall
SELECT category, COUNT(*) as n
FROM pain_points
GROUP BY category ORDER BY n DESC LIMIT 10;

-- T2-specific pain points, highest severity
SELECT pain_point, severity_score, caregiver_type, source_text
FROM pain_points
WHERE track_relevance IN ('T2', 'both')
ORDER BY severity_score DESC LIMIT 20;

-- Best quotes for application narrative
SELECT quote, context, theme, track_relevance
FROM quotes
WHERE quality_score = 5
ORDER BY track_relevance, theme;

-- Source coverage check
SELECT source, subreddit, COUNT(*) as posts
FROM posts
GROUP BY source, subreddit ORDER BY posts DESC;
```

---

## Implementation Notes for Claude Code

- All modules independently runnable: `python src/module.py`
- Use `logging` throughout (not print); format: `[stage] message`
- All DuckDB writes use transactions
- ChromaDB collection names are stable schema — do not rename
- `query.py` output format is the human-facing contract — keep it consistent
- `--dry-run` flag on `run_pipeline.py` skips all API calls
- Python 3.11+; dataclasses for internal structures
- Pin major versions in `requirements.txt`

---

_Spec version: 2.0_
_Last updated: April 2026_
_Application deadline: July 31, 2026_
