from dotenv import load_dotenv
load_dotenv()
from src.db import init_db, get_duck
init_db()
conn = get_duck()

print("=== POST-PROCESSING QUALITY REPORT ===\n")

rows = conn.execute("""
    SELECT subreddit,
           COUNT(*) as total,
           SUM(CASE WHEN is_processed=TRUE AND normalized_body IS NOT NULL THEN 1 ELSE 0 END) as kept,
           SUM(CASE WHEN is_processed=TRUE AND normalized_body IS NULL THEN 1 ELSE 0 END) as dropped,
           SUM(CASE WHEN caregiver_type_heuristic = 'family' THEN 1 ELSE 0 END) as family,
           SUM(CASE WHEN caregiver_type_heuristic = 'paid_direct_care' THEN 1 ELSE 0 END) as paid,
           SUM(CASE WHEN caregiver_type_heuristic = 'unclear' THEN 1 ELSE 0 END) as unclear
    FROM posts
    GROUP BY subreddit
    ORDER BY kept DESC
""").fetchall()

print(f"{'Subreddit':<15} {'Total':>6} {'Kept':>6} {'Dropped':>8} {'Family':>7} {'Paid':>6} {'Unclear':>8}")
print("-" * 65)
for sub, total, kept, dropped, fam, paid, unc in rows:
    print(f"{(sub or 'N/A'):<15} {total:>6} {kept:>6} {dropped:>8} {fam:>7} {paid:>6} {unc:>8}")

total_kept = conn.execute(
    "SELECT COUNT(*) FROM posts WHERE is_processed=TRUE AND normalized_body IS NOT NULL"
).fetchone()[0]
total_posts = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
comments = conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0]

print()
print(f"Total posts collected:   {total_posts}")
print(f"Total kept for analysis: {total_kept}")
print(f"Total comments:          {comments}")
print()

# Caregiver type totals across all kept posts
print("=== CAREGIVER TYPE (kept posts) ===\n")
type_rows = conn.execute("""
    SELECT caregiver_type_heuristic, COUNT(*) as n
    FROM posts
    WHERE is_processed=TRUE AND normalized_body IS NOT NULL
    GROUP BY caregiver_type_heuristic
    ORDER BY n DESC
""").fetchall()
for t, n in type_rows:
    pct = n / total_kept * 100 if total_kept else 0
    print(f"  {(t or 'None'):<20} {n:>4}  ({pct:.0f}%)")
