import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from dotenv import load_dotenv; load_dotenv()
from src.db import init_db, get_chroma; init_db()
from sentence_transformers import SentenceTransformer
import logging; logging.basicConfig(level=logging.WARNING)

QUERIES = [
    ("Retention & Quitting",
     "CNA quit nursing home burned out leaving healthcare can't do it anymore short staffed ratio"),
    ("Low Pay & Wages",
     "CNA pay minimum wage $15 $16 not enough underpaid why nobody wants to work shortage"),
    ("Short-Staffing Crisis",
     "short staffed three aides eighteen residents ratio mandatory overtime double shift called out"),
    ("Documentation & Charting Time",
     "charting takes forever paperwork time consuming documentation shift notes care plan binder"),
    ("Abusive Clients & Safety",
     "client hit me scratched bit attacked verbally abusive aggressive resident unsafe"),
    ("Scheduling Conflicts",
     "mandatory call out PRN shift manager no exceptions schedule last minute coverage"),
    ("Bad Management",
     "management doesn't care DON supervisor unfair fired threatened no support administration"),
    ("I/DD Direct Support",
     "DSP group home developmental disability intellectual disability direct support professional clients behaviors"),
]

client = get_chroma()
col = client.get_collection("post_chunks")
model = SentenceTransformer("all-mpnet-base-v2")

print("=" * 75)
print("TRACK 2 — REFINED CNA-NATIVE LANGUAGE QUERIES")
print("=" * 75)

all_scores = []
for label, query in QUERIES:
    emb = model.encode(query).tolist()
    res = col.query(query_embeddings=[emb], n_results=10,
                    include=["documents", "metadatas", "distances"])
    docs = res["documents"][0]
    dists = res["distances"][0]
    scored = sorted([(1 - d, doc) for d, doc in zip(dists, docs)], reverse=True)
    top = scored[0][0] if scored else 0
    all_scores.append((label, top, scored))
    print(f"\n  [top score: {top:.3f}]  {label}")
    for score, doc in scored[:3]:
        print(f"    ({score:.3f}): \"{doc[:260]}\"")

print("\n" + "=" * 75)
print("SUMMARY — Track 2 themes by top semantic score")
print("=" * 75)
all_scores.sort(key=lambda x: -x[1])
for label, top, _ in all_scores:
    bar = "#" * int(top * 20) if top > 0 else ""
    print(f"  {label:<35} {top:>6.3f}  {bar}")
