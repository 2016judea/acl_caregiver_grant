"""
Batch semantic analysis against ChromaDB post_chunks.
Maps findings to ACL Caregiver AI Challenge Track 1 and Track 2.
"""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv
load_dotenv()

from src.db import init_db, get_chroma
init_db()

from sentence_transformers import SentenceTransformer
import logging
logging.basicConfig(level=logging.WARNING)

THRESHOLD = 0.20   # cosine similarity cutoff for "hit" counting
TOP_N = 50         # results to retrieve per query
EXCERPT_N = 3      # representative excerpts per query (always from top regardless of threshold)

QUERIES = {
    # --- TRACK 1: Family Caregiver Tools ---
    "T1": [
        ("Caregiver Burnout & Emotional Exhaustion",
         "caregiver burnout exhaustion overwhelmed stress mental health breakdown"),
        ("Medication Management",
         "medication management tracking reminders dosage missed pills prescriptions"),
        ("Care Coordination & Navigation",
         "care coordination doctor appointments specialist hospital discharge planning"),
        ("Isolation & Loneliness",
         "caregiver isolation loneliness no support alone depression grief"),
        ("Dementia Behavioral Symptoms",
         "dementia sundowning wandering agitation confusion memory loss alzheimers behaviors"),
        ("Financial Stress & Cost of Care",
         "financial stress cost of care insurance coverage paying for help unaffordable"),
        ("Safety Monitoring & Fall Prevention",
         "fall prevention home safety monitoring alert emergency response seniors"),
        ("End-of-Life & Hospice",
         "end of life hospice dying grief palliative care death wishes advance directive"),
        ("I/DD Caregiving",
         "intellectual disability developmental disability autism cerebral palsy IDD special needs caregiver"),
        ("Finding Resources & Benefits",
         "finding resources benefits programs Medicaid Medicare respite help applying"),
        ("Family Conflict & Decision Making",
         "family conflict disagreement siblings decisions nursing home placement guilt"),
    ],

    # --- TRACK 2: Direct Care Workforce ---
    "T2": [
        ("Documentation & Charting Burden",
         "documentation charting paperwork EMR electronic health records time burden administrative"),
        ("Scheduling & Staffing Shortages",
         "short staffed understaffed scheduling coverage last minute call out overtime mandatory"),
        ("Workforce Retention & Turnover",
         "quit leaving job burnout turnover retention why aides leave high turnover"),
        ("Training & Skill Development",
         "training certification skills competency learning on the job continuing education CNA"),
        ("Low Pay & Compensation",
         "low pay wages minimum wage underpaid compensation benefits poverty living wage"),
        ("Workplace Safety & Client Behavior",
         "workplace safety aggressive client behavior injury assault unsafe working conditions"),
        ("Shift Communication & Handoffs",
         "shift handoff communication report change of shift passing information between staff"),
        ("Supervision & Management Issues",
         "bad management supervisor unreasonable expectations unfair treatment workplace"),
        ("Caregiver Workforce Dementia Care",
         "dementia patients care workers behavioral interventions memory care unit paid staff"),
        ("I/DD Provider Workforce",
         "group home residential facility IDD provider direct support professional DSP"),
    ],
}


def run():
    client = get_chroma()
    try:
        col = client.get_collection("post_chunks")
    except Exception:
        print("ERROR: post_chunks collection not found. Run embedder first.")
        return

    total_chunks = col.count()
    print(f"post_chunks collection: {total_chunks} chunks\n")

    model = SentenceTransformer("all-mpnet-base-v2")

    results_by_track = {}

    for track, query_list in QUERIES.items():
        results_by_track[track] = []
        for label, query_text in query_list:
            embedding = model.encode(query_text).tolist()
            res = col.query(
                query_embeddings=[embedding],
                n_results=min(TOP_N, total_chunks),
                include=["documents", "metadatas", "distances"],
            )
            docs = res["documents"][0]
            metas = res["metadatas"][0]
            dists = res["distances"][0]

            # Count hits above threshold
            scored = [(doc, meta, 1 - dist)
                      for doc, meta, dist in zip(docs, metas, dists)]
            hits = [(doc, meta, s) for doc, meta, s in scored if s >= THRESHOLD]

            # Source breakdown from all scored results
            sources = {}
            for _, meta, _ in hits:
                src = meta.get("source", "unknown")
                sources[src] = sources.get(src, 0) + 1

            # Top excerpts always from the top results regardless of threshold
            excerpts = [(s[:280], score, meta.get("source", "?"))
                        for s, meta, score in scored[:EXCERPT_N]]

            results_by_track[track].append({
                "label": label,
                "query": query_text,
                "hit_count": len(hits),
                "top_score": round(scored[0][2], 3) if scored else 0,
                "sources": sources,
                "excerpts": excerpts,
            })

    # --- Print report ---
    for track, results in results_by_track.items():
        track_label = (
            "TRACK 1: AI Tools to Support Caregivers"
            if track == "T1"
            else "TRACK 2: AI Tools for Extending the Caregiver Workforce"
        )
        print("=" * 75)
        print(f"{track_label}")
        print("=" * 75)

        # Sort by hit count descending
        results.sort(key=lambda x: x["hit_count"], reverse=True)

        for r in results:
            src_str = "  ".join(
                f"{k}:{v}" for k, v in
                sorted(r["sources"].items(), key=lambda x: -x[1])
            )
            print(f"\n  [{r['hit_count']:>4} hits | top score: {r['top_score']}]  {r['label']}")
            if src_str:
                print(f"         Sources: {src_str}")
            for i, (excerpt, score, src) in enumerate(r["excerpts"], 1):
                print(f"         Ex{i} (score:{score:.3f}, {src}): \"{excerpt}\"")

        print()

    # --- Summary table ---
    print("=" * 75)
    print("SUMMARY: Hit counts by theme (threshold >= {:.2f} similarity)".format(THRESHOLD))
    print("=" * 75)
    print(f"\n{'Theme':<42} {'Track':>6} {'Hits':>6} {'Top Score':>10}")
    print("-" * 68)
    all_results = [
        (r["label"], track, r["hit_count"], r["top_score"])
        for track, results in results_by_track.items()
        for r in results
    ]
    all_results.sort(key=lambda x: -x[2])
    for label, track, hits, top_score in all_results:
        print(f"{label:<42} {track:>6} {hits:>6} {top_score:>10.3f}")


if __name__ == "__main__":
    run()
