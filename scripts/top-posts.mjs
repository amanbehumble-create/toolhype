#!/usr/bin/env node
// Refresh topPosts in src/data/buzz.json using scripts/top-posts-lib.mjs.
// Pools: <rawDir>/<slug>.posts.txt (daily scan) + <rawDir>/top/<slug>.txt (engagement search:
//   search_posts_all("<query> -is:reply -is:retweet", sort_order=relevancy, max_results=25, start_time=now-7d,
//   post.fields=public_metrics,created_at,author_id,in_reply_to_user_id,referenced_tweets,entities,note_tweet, expansions=author_id, user.fields=username))
// + <rawDir>/top/lookup*.txt (get_posts_by_ids metric refreshes). Usage: node scripts/top-posts.mjs [rawDir]
import fs from 'node:fs';
import { selectTop, normalize } from './top-posts-lib.mjs';
const rawDir = process.argv[2] || '/workspace/buzzraw';
const outFile = new URL('../src/data/buzz.json', import.meta.url);
const buzz = JSON.parse(fs.readFileSync(outFile));
const json = (f) => { try { const s = fs.readFileSync(f, 'utf8'); const i = s.indexOf('{'); let d = 0;
  for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) return JSON.parse(s.slice(i, j + 1)); } } catch { return null; } };
const fresh = {};
const td = `${rawDir}/top`;
for (const f of fs.existsSync(td) ? fs.readdirSync(td).filter((f) => f.startsWith('lookup')) : []) for (const p of normalize(json(`${td}/${f}`))) fresh[p.id] = p;
const official = (fs.existsSync(td) ? fs.readdirSync(td).filter((f) => f.startsWith('_official')) : []).flatMap((f) => normalize(json(`${td}/${f}`)));
let shown = 0;
for (const [slug, t] of Object.entries(buzz.tools)) {
  if (!t.query) continue;
  let pool = [...(fs.existsSync(td) ? fs.readdirSync(td).filter((f) => new RegExp(`^${slug}\\d*\\.txt$`).test(f)) : []).flatMap((f) => normalize(json(`${td}/${f}`))), ...normalize(json(`${rawDir}/${slug}.posts.txt`)), ...(t.topPosts || []), ...official];
  pool = pool.map((p) => fresh[p.id] ? { ...p, ...fresh[p.id], text: p.text.length > fresh[p.id].text.length ? p.text : fresh[p.id].text, isReply: p.isReply || fresh[p.id].isReply } : p);
  t.topPosts = selectTop(slug, t.query, pool, buzz.computedAt || Date.now()).map(({ isReply, urls, ...p }) => p);
  if (t.topPosts.length) shown++;
}
buzz.topPostsRule = 'Top 3 original X posts that mention the tool with >=100 likes or >=10K views, ranked by likes + 3*reposts + 2*replies + 2*quotes + views/100. Hidden if none qualify.';
buzz.topPostsUpdatedAt = new Date().toISOString();
fs.writeFileSync(outFile, JSON.stringify(buzz, null, 1));
console.log(`tools with posts: ${shown}/${Object.keys(buzz.tools).length}`);
