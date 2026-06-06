import sys
from dotenv import load_dotenv
load_dotenv()
from src.db import init_db, get_duck
init_db()
from src.collector import RedditCollector, AgingCareCollector

SUBREDDITS = ["AgingParents", "dementia", "caregivers", "caregiving", "eldercare", "CNA"]


def quality_check(conn, label, subreddit=None, source=None):
    if subreddit:
        row = conn.execute("""
            SELECT COUNT(*), ROUND(AVG(word_count),0), MIN(word_count), MAX(word_count),
                   SUM(CASE WHEN word_count < 50 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN body IN ('', '[removed]', '[deleted]') OR body IS NULL THEN 1 ELSE 0 END)
            FROM posts WHERE subreddit = ?
        """, (subreddit,)).fetchone()
    else:
        row = conn.execute("""
            SELECT COUNT(*), ROUND(AVG(word_count),0), MIN(word_count), MAX(word_count),
                   SUM(CASE WHEN word_count < 50 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN body IN ('', '[removed]', '[deleted]') OR body IS NULL THEN 1 ELSE 0 END)
            FROM posts WHERE source = ?
        """, (source,)).fetchone()

    n, avg, mn, mx, short, empty = row
    issues = []
    if n == 0:
        issues.append("NO POSTS COLLECTED")
    if n > 0 and short / n > 0.3:
        issues.append(f"high short rate ({short}/{n})")
    if n > 0 and empty / n > 0.2:
        issues.append(f"high empty rate ({empty}/{n})")

    status = "WARN: " + ", ".join(issues) if issues else "OK"
    print(f"  {label:<22}  posts:{n:>4}  avg_words:{int(avg or 0):>5}  "
          f"range:[{mn or 0}-{mx or 0}]  short:{short:>3}  empty:{empty:>3}  [{status}]")
    sys.stdout.flush()


conn = get_duck()

print("=" * 75)
print("REDDIT COLLECTION")
print("=" * 75)

for sub in SUBREDDITS:
    print(f"\nCollecting r/{sub} ...", flush=True)
    c = RedditCollector(subreddits=[sub], post_limit=500, _delay=0.5)
    n = c.collect()
    print(f"  +{n} new posts", flush=True)
    quality_check(conn, f"r/{sub}", subreddit=sub)

print("\n" + "=" * 75)
print("AGINGCARE COLLECTION")
print("=" * 75)
print("\nCollecting agingcare.com ...", flush=True)
ac = AgingCareCollector()
n = ac.collect()
print(f"  +{n} new posts", flush=True)
quality_check(conn, "agingcare.com", source="agingcare")

print("\n" + "=" * 75)
print("OVERALL SUMMARY")
print("=" * 75)
rows = conn.execute("""
    SELECT source, subreddit, COUNT(*) as n,
           ROUND(AVG(word_count), 0) as avg_words,
           SUM(CASE WHEN word_count < 50 THEN 1 ELSE 0 END) as short
    FROM posts
    GROUP BY source, subreddit
    ORDER BY source, n DESC
""").fetchall()

print(f"\n{'Source':<25}  {'Posts':>6}  {'Avg words':>10}  {'Short (<50)':>12}")
print("-" * 60)
for src, sub, n, avg, short in rows:
    label = f"{src}/{sub or 'N/A'}"
    print(f"{label:<25}  {n:>6}  {int(avg or 0):>10}  {short:>12}")

total_posts = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
total_comments = conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0]
print(f"\nTotal posts:    {total_posts}")
print(f"Total comments: {total_comments}")
