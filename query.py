import click
from src.db import get_duck, init_db


def _conn():
    init_db()
    return get_duck()


@click.group()
def cli():
    """Caregiver insight query interface."""


@cli.command()
def stats():
    """Summary counts from DuckDB."""
    conn = _conn()

    posts = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
    processed = conn.execute(
        "SELECT COUNT(*) FROM posts WHERE is_processed = TRUE AND normalized_body IS NOT NULL"
    ).fetchone()[0]
    pain_points = conn.execute("SELECT COUNT(*) FROM pain_points").fetchone()[0]
    quotes = conn.execute("SELECT COUNT(*) FROM quotes").fetchone()[0]
    themes = conn.execute("SELECT COUNT(*) FROM theme_summaries").fetchone()[0]

    t1 = conn.execute(
        "SELECT COUNT(*) FROM pain_points WHERE track_relevance IN ('T1', 'both')"
    ).fetchone()[0]
    t2 = conn.execute(
        "SELECT COUNT(*) FROM pain_points WHERE track_relevance IN ('T2', 'both')"
    ).fetchone()[0]

    click.echo("## Dataset Stats\n")
    click.echo(f"Posts collected:    {posts}")
    click.echo(f"Posts processed:    {processed}")
    click.echo(f"Pain points:        {pain_points}  (T1: {t1}, T2: {t2})")
    click.echo(f"Quotes:             {quotes}")
    click.echo(f"Theme summaries:    {themes}")

    click.echo("\n### Pain Points by Category\n")
    rows = conn.execute(
        """SELECT category, COUNT(*) as n, ROUND(AVG(severity_score), 1) as avg_sev
           FROM pain_points GROUP BY category ORDER BY n DESC"""
    ).fetchall()
    if rows:
        click.echo(f"{'Category':<25} {'Count':>6} {'Avg Severity':>13}")
        click.echo("-" * 47)
        for cat, n, avg in rows:
            click.echo(f"{cat or 'unknown':<25} {n:>6} {avg or 0:>13.1f}")
    else:
        click.echo("No pain points yet.")


@cli.command()
@click.option("--category", default=None, help="Filter by category")
@click.option("--track", default=None, type=click.Choice(["T1", "T2"]), help="Filter by track")
@click.option("--limit", default=10, show_default=True, help="Max results")
def top(category, track, limit):
    """Top pain points by severity."""
    conn = _conn()

    where_clauses = []
    params = []
    if category:
        where_clauses.append("category = ?")
        params.append(category)
    if track:
        where_clauses.append("track_relevance IN (?, 'both')")
        params.append(track)

    where = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    params.append(limit)

    rows = conn.execute(
        f"""SELECT pain_point, category, track_relevance, severity_score,
                   frequency_indicator, caregiver_type, source_text
            FROM pain_points {where}
            ORDER BY severity_score DESC
            LIMIT ?""",
        params,
    ).fetchall()

    if not rows:
        click.echo("No pain points found.")
        return

    label_parts = []
    if category:
        label_parts.append(f"category={category}")
    if track:
        label_parts.append(f"track={track}")
    label = f" | {', '.join(label_parts)}" if label_parts else ""
    click.echo(f"## Top Pain Points{label}\n")

    for pain_point, cat, track_rel, sev, freq, cg_type, excerpt in rows:
        click.echo(f"### severity:{sev} | {track_rel} | {cg_type} | {cat}")
        click.echo(f"**Pain point**: {pain_point}")
        if excerpt:
            click.echo(f"**Excerpt**: \"{excerpt}\"")
        click.echo(f"*{freq}*\n")


@cli.command()
@click.option("--track", default=None, type=click.Choice(["T1", "T2"]), help="Filter by track")
def themes(track):
    """Theme summaries from DuckDB."""
    conn = _conn()

    where = ""
    params = []
    if track:
        where = "WHERE track_relevance IN (?, 'both')"
        params.append(track)

    rows = conn.execute(
        f"""SELECT theme, description, post_count, avg_severity, track_relevance,
                   top_categories, sample_quote, application_angle
            FROM theme_summaries {where}
            ORDER BY avg_severity DESC""",
        params,
    ).fetchall()

    if not rows:
        click.echo("No theme summaries found. Run synthesizer.py first.")
        return

    label = f" (track={track})" if track else ""
    click.echo(f"## Themes{label}\n")

    for theme, desc, count, avg_sev, track_rel, top_cats, quote, angle in rows:
        click.echo(f"### {theme} | {track_rel} | {count} posts | avg severity {avg_sev:.1f}")
        if desc:
            click.echo(desc)
        if top_cats:
            click.echo(f"*Categories*: {top_cats}")
        if quote:
            click.echo(f"> \"{quote}\"")
        if angle:
            click.echo(f"**Grant angle**: {angle}")
        click.echo()


@cli.command()
@click.argument("query")
@click.option("--track", default=None, type=click.Choice(["T1", "T2"]))
@click.option("--collection", default=None,
              type=click.Choice(["pain_points", "quotes", "theme_summaries", "post_chunks"]))
@click.option("--limit", default=5, show_default=True, help="Results per collection")
def search(query, track, collection, limit):
    """Semantic search across ChromaDB collections."""
    from src.db import get_chroma, init_db
    init_db()
    client = get_chroma()

    collection_names = [collection] if collection else ["pain_points", "quotes", "post_chunks"]
    cols = []
    for name in collection_names:
        try:
            col = client.get_collection(name)
            if col.count() > 0:
                cols.append(col)
        except Exception:
            pass

    if not cols:
        click.echo("No embeddings found — run `python run_pipeline.py --stage embed` first.")
        return

    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-mpnet-base-v2")
    embedding = model.encode(query).tolist()

    click.echo(f'\n## Search: "{query}"\n')
    total = 0

    for col in cols:
        n = min(limit, col.count())
        where = {"track_relevance": {"$in": [track, "both"]}} if track else None
        try:
            results = col.query(
                query_embeddings=[embedding],
                n_results=n,
                where=where,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as e:
            click.echo(f"[{col.name}] query error: {e}")
            continue

        docs = results["documents"][0]
        metas = results["metadatas"][0]
        dists = results["distances"][0]

        if not docs:
            continue

        click.echo(f"### [{col.name}]\n")
        for doc, meta, dist in zip(docs, metas, dists):
            score = round(1 - dist, 3)
            track_rel = meta.get("track_relevance", "?")
            cg_type = meta.get("caregiver_type", "?")
            source = meta.get("source", "?")
            click.echo(f"**score:{score}** | {track_rel} | {cg_type} | {source}")
            click.echo(f"{doc[:300]}")
            click.echo()
            total += 1

    click.echo(f"— {total} result(s) returned")


if __name__ == "__main__":
    cli()
