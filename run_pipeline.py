#!/usr/bin/env python3
"""
Pipeline orchestrator.

Automated stages: collect → process → embed → report
Analysis and synthesis are done interactively in Claude Code:
  1. python src/export.py --batch-size 20   (read next batch)
  2. [Claude Code extracts pain_points + quotes]
  3. Repeat until all posts analyzed
  4. python run_pipeline.py --stage embed   (embed results)
  5. [Claude Code writes theme_summaries via ingest_analysis.py]
  6. python run_pipeline.py --stage embed   (embed themes)
  7. python run_pipeline.py --stage report
"""
import argparse
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

STAGES = ["collect", "process", "embed", "report"]


def run_collect(dry_run: bool):
    from src.collector import RedditCollector, AgingCareCollector
    from src.db import init_db
    init_db()
    reddit = RedditCollector()
    n = reddit.collect()
    logger.info(f"[pipeline] reddit: {n} new posts")
    agingcare = AgingCareCollector()
    m = agingcare.collect()
    logger.info(f"[pipeline] agingcare: {m} new posts")


def run_process(dry_run: bool):
    from src.processor import run as processor_run
    stats = processor_run()
    logger.info(f"[pipeline] processor: {stats}")


def run_embed(dry_run: bool):
    from src.embedder import embed_all
    from src.db import get_duck, get_chroma, init_db
    init_db()
    embed_all(get_duck(), get_chroma())
    logger.info("[pipeline] embed complete")


def run_report(dry_run: bool):
    from src.report import run
    run()


RUNNERS = {
    "collect": run_collect,
    "process": run_process,
    "embed": run_embed,
    "report": run_report,
}


def main():
    parser = argparse.ArgumentParser(
        description="Caregiver mining pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Stages: collect → process → [Claude Code analysis] → embed → report",
    )
    parser.add_argument("--stage", choices=STAGES, help="Run a single stage")
    parser.add_argument(
        "--from", dest="from_stage", choices=STAGES, help="Resume from this stage"
    )
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
        RUNNERS[stage](dry_run=False)

    logger.info("[pipeline] done.")


if __name__ == "__main__":
    main()
