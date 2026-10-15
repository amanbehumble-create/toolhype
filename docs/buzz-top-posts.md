# "Why it's buzzing" rule (set by Aman/Adrian, 2026-10-16)

Tool pages only showcase **high-engagement, on-topic X posts**.

- **Qualify:** original post (no replies, no retweets) with **≥100 likes**, or **≥10K views and ≥10 likes**.
- **Relevant:** the tool must be named in the post text (keywords from `scripts/buzz-queries.json`; a bare link doesn't count). Ambiguous names have exclude lists in `scripts/top-posts-lib.mjs` (e.g. Figma the toy-figure line).
- **Rank:** likes + 3×reposts + 2×replies + 2×quotes + views/100. Show the **top 3**.
- **None qualify:** show "No standout X posts yet" instead of weak posts.
- **Never fabricate metrics.** Numbers come only from the public X API (`x` MCP: `search_posts_all`, `get_posts_by_ids`).

## Collection
1. Daily scan pool: `<rawDir>/<slug>.posts.txt` (see scripts/buzz.mjs).
2. Engagement search per tool: `search_posts_all("<query> -is:retweet -is:reply", sort_order=relevancy, max_results=25, start_time=now-7d)` → `<rawDir>/top/<slug>.txt` (extra queries `<slug>2.txt`…). Note: `min_faves:` is NOT supported by this API (silently ignored), so we filter locally.
3. Refresh metrics of chosen posts with one `get_posts_by_ids` call (≤100 ids) → `<rawDir>/top/lookup-*.txt`.
4. `node scripts/top-posts.mjs [rawDir]` rewrites `topPosts` in `src/data/buzz.json`. `scripts/buzz.mjs` applies the same rule.

Limitation: with 25 posts per search, very high-volume names (ChatGPT, Grok, Cursor, Canva) often return only small recent posts, so they may show none.
