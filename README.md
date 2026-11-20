# Caregiver AI Challenge — Data Mining System

**Live:** https://cna-shield.vercel.app · https://dementia-coach.vercel.app

**Status:** ACL Phase 1 was not selected (2026-11-19). Neither track won; there were 18 winners of ~650.
See [applications/PHASE1_OUTCOME.md](applications/PHASE1_OUTCOME.md).

A data-mining, analysis, and retrieval pipeline built for the ACL (Administration for
Community Living) **Caregiver AI Challenge**. It surfaces real pain points from online
caregiver communities to inform which track(s) to apply to and to provide evidence-backed
insights for the application narrative.

## What it does

1. Collects posts from caregiver communities (Reddit, AgingCare.com, care-worker forums).
2. Analyzes them through two lenses — Track 1 (individual caregiver experience) and
   Track 2 (workforce / org efficiency).
3. Stores structured insights in **DuckDB** for analytical queries.
4. Stores semantic embeddings in **ChromaDB** for fuzzy retrieval.
5. Exposes a query interface (`query.py`) so insights can be retrieved during brainstorming
   and writing sessions.

The system stays track-agnostic at collection time — the same raw data feeds both lenses.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # then fill in paths / API keys
```

`.env` holds local paths (`DUCKDB_PATH`, `CHROMA_PATH`) plus the Reddit and Anthropic
credentials referenced in `DESIGN.md`.

## Run

```bash
python run_pipeline.py     # collect → analyze → store
python query.py            # retrieve insights
python quality_report.py   # data-quality summary
```

See `DESIGN.md` for the full architecture and project spec.
