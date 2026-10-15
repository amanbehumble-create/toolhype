#!/usr/bin/env node
/**
 * toolhype daily scan (OUTLINE / STUB — not wired yet).
 *
 * Pipeline:
 *  1. Product Hunt  — GraphQL API v2 (https://api.producthunt.com/v2/api/graphql), token in PH_TOKEN.
 *     Query today's posts in AI / developer-tools topics; keep name, tagline, website, votesCount.
 *  2. GitHub trending — GitHub has no official trending API. Use the search API:
 *     GET /search/repositories?q=topic:ai+created:>=<7d ago>&sort=stars (GITHUB_TOKEN).
 *  3. X — X API v2 recent search (X_BEARER_TOKEN): "<tool name> OR <domain>" over 7 days ->
 *     mentions7d, engagement, sentiment -> buzz.score 0-100 (written to tools.json / Supabase).
 *  4. Dedupe by domain against src/data/tools.json; new items get source=ph|github|x, addedAt=today.
 *  5. An agent writes verdict/useThisIf/useCases (human review before publish).
 *  6. Write to src/data/tools.json (later: upsert into Supabase `tools`), commit -> Cloudflare rebuild.
 */
const steps = ['productHunt', 'githubTrending', 'xBuzz', 'dedupe', 'writeups', 'persist'];
for (const s of steps) console.log(`[scan] ${s}: not implemented yet`);
