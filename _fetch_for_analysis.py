import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from dotenv import load_dotenv; load_dotenv()
from src.db import init_db, get_duck; init_db()
conn = get_duck()

t1 = conn.execute("""
    SELECT id, title, normalized_body, caregiver_type_heuristic, subreddit
    FROM posts
    WHERE is_processed = TRUE AND normalized_body IS NOT NULL
      AND subreddit IN ('AgingParents', 'dementia', 'eldercare', 'caregivers')
      AND caregiver_type_heuristic = 'family'
      AND word_count > 100
      AND id NOT IN (SELECT DISTINCT post_id FROM pain_points)
      AND (normalized_body ILIKE '%burnout%' OR normalized_body ILIKE '%exhausted%'
        OR normalized_body ILIKE '%overwhelm%' OR normalized_body ILIKE '%fall%'
        OR normalized_body ILIKE '%medication%' OR normalized_body ILIKE '%dementia%')
    ORDER BY score DESC
    LIMIT 15
""").fetchall()

t2 = conn.execute("""
    SELECT id, title, normalized_body, caregiver_type_heuristic, subreddit
    FROM posts
    WHERE is_processed = TRUE AND normalized_body IS NOT NULL
      AND subreddit = 'CNA'
      AND word_count > 80
      AND id NOT IN (SELECT DISTINCT post_id FROM pain_points)
      AND (normalized_body ILIKE '%short staff%' OR normalized_body ILIKE '%understaffed%'
        OR normalized_body ILIKE '%quit%' OR normalized_body ILIKE '%wage%'
        OR normalized_body ILIKE '%ratio%' OR normalized_body ILIKE '%chart%'
        OR normalized_body ILIKE '%mandate%' OR normalized_body ILIKE '%pay%')
    ORDER BY score DESC
    LIMIT 15
""").fetchall()

print(f"T1 rows: {len(t1)}  T2 rows: {len(t2)}\n")

print("=== TRACK 1: Family Caregiver Posts ===")
for id_, title, body, cg, sub in t1:
    print(f"\n--- {id_} | r/{sub} | {cg} ---")
    print(f"TITLE: {title}")
    print(f"BODY: {body[:1400]}")

print("\n\n=== TRACK 2: CNA / Direct Care Workforce Posts ===")
for id_, title, body, cg, sub in t2:
    print(f"\n--- {id_} | r/{sub} | {cg} ---")
    print(f"TITLE: {title}")
    print(f"BODY: {body[:1400]}")
