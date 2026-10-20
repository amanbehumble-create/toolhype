#!/usr/bin/env node
// Live X Buzz Score builder.
// Inputs (fetched by the daily-ops agent via the public X API reads, see scripts/buzz-queries.json):
//   <rawDir>/<slug>.counts.txt  -> get_posts_counts_recent(query, granularity=hour)  (last 7 days)
//   <rawDir>/<slug>.posts.txt   -> search_posts_all(query, sort_order=relevancy, max_results<=25, start_time=now-7d,
//                                   post.fields=public_metrics,created_at, expansions=author_id, user.fields=username)
// Output: src/data/buzz.json  (raw inputs + computed score). Usage: node scripts/buzz.mjs [rawDir]
import fs from 'node:fs';
import { selectTop } from './top-posts-lib.mjs';
const rawDir = process.argv[2] || '/workspace/buzzraw';
const queries = JSON.parse(fs.readFileSync(new URL('./buzz-queries.json', import.meta.url)));
const outFile = new URL('../src/data/buzz.json', import.meta.url);
const prev = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile)) : { tools: {} };
const json = (f) => { const s = fs.readFileSync(f, 'utf8'); const i = s.indexOf('{'); let d = 0;
  for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) return JSON.parse(s.slice(i, j + 1)); } };

const now = new Date();
const tools = {};
for (const [slug, query] of Object.entries(queries)) {
  const cf = `${rawDir}/${slug}.counts.txt`;
  if (!fs.existsSync(cf)) { tools[slug] = prev.tools[slug] || { status: 'pending', query }; continue; }
  const buckets = json(cf).data || [];
  const end = new Date(buckets.at(-1).end).getTime();
  const m24 = buckets.filter((b) => new Date(b.end).getTime() > end - 864e5).reduce((a, b) => a + b.tweet_count, 0);
  const m7 = buckets.reduce((a, b) => a + b.tweet_count, 0);
  const priorDays = Math.max((end - new Date(buckets[0].start).getTime()) / 864e5 - 1, 1);
  const priorAvg = (m7 - m24) / priorDays;
  const velocity = +(m24 / Math.max(priorAvg, 1)).toFixed(2);
  // daily series (7 points, oldest first) for the sparkline
  const daily = Array.from({ length: 7 }, (_, k) => buckets.filter((b) => {
    const t = new Date(b.end).getTime(); return t > end - (7 - k) * 864e5 && t <= end - (6 - k) * 864e5; }).reduce((a, b) => a + b.tweet_count, 0));
  // engagement sample
  let sample = 0, likes = 0, reposts = 0, replies = 0, top = [];
  const pf = `${rawDir}/${slug}.posts.txt`;
  // <slug>.extra.txt: optional get_posts_by_ids result for known posts that match the query (e.g. a viral post the
  // relevancy sample missed). Merged into the sample and de-duplicated by id.
  const ef = `${rawDir}/${slug}.extra.txt`;
  if (fs.existsSync(pf) || fs.existsSync(ef)) {
    const ps = [pf, ef].filter((f) => fs.existsSync(f)).map(json);
    const p = { data: [...new Map(ps.flatMap((x) => x.data || []).map((x) => [x.id, x])).values()], includes: { users: ps.flatMap((x) => x.includes?.users || []) } }; const users = Object.fromEntries((p.includes?.users || []).map((u) => [u.id, u.username]));
    const posts = (p.data || []).map((x) => ({ id: x.id, url: x.url || `https://x.com/i/status/${x.id}`, author: users[x.author_id] || null,
      text: (x.text || '').slice(0, 220), created_at: x.created_at, likes: x.public_metrics?.like_count || 0,
      reposts: x.public_metrics?.retweet_count || 0, replies: x.public_metrics?.reply_count || 0, views: x.public_metrics?.impression_count ?? null, quotes: x.public_metrics?.quote_count || 0 }));
    sample = posts.length;
    for (const x of posts) { likes += x.likes; reposts += x.reposts; replies += x.replies; }
    top = selectTop(slug, query, [...posts, ...((prev.tools[slug] || {}).topPosts || [])], now); // high-engagement + relevant only (docs/buzz-top-posts.md)
  }
  const eng = likes + 3 * reposts + 2 * replies + top.reduce((a, b) => a + b.quotes, 0) * 2;
  // Score: volume (0-50) + velocity spike (0-25) + engagement (0-25)
  const vol = Math.min(50, (Math.log10(1 + m7) / 5) * 50);           // 100k+ posts/7d = 50
  // spike bonus is damped for tiny volumes so 3 posts -> 15 posts can't outrank a real surge (full weight at 100+ posts/24h)
  const vel = Math.min(25, Math.max(0, Math.log2(Math.max(velocity, 1)) * 12.5)) * Math.min(1, Math.log10(1 + m24) / 2);
  const en = Math.min(25, (Math.log10(1 + eng) / 5) * 25);           // 100k weighted engagements = 25
  const score = Math.round(vol + vel + en);
  const peakDay = Math.max(...daily); const peakIdx = daily.indexOf(peakDay);
  const viral = top.some((x) => x.likes >= 5000);
  const label = (velocity >= 2 && m24 >= 20) || viral ? 'hype' : velocity >= 1.3 && m24 >= 5 ? 'rising' : m7 >= 50 ? 'steady' : 'quiet';
  tools[slug] = { status: 'live', query, mentions24h: m24, mentions7d: m7, priorDailyAvg: +priorAvg.toFixed(1), velocity, daily, peakDay, peakDaysAgo: 6 - peakIdx,
    sample: { posts: sample, likes, reposts, replies }, parts: { volume: +vol.toFixed(1), velocity: +vel.toFixed(1), engagement: +en.toFixed(1) },
    score, label, viral, topPosts: top, computedAt: now.toISOString() };
}
fs.writeFileSync(outFile, JSON.stringify({ computedAt: now.toISOString(), method: 'v1', tools }, null, 1));
const live = Object.entries(tools).filter(([, t]) => t.status === 'live').sort((a, b) => b[1].score - a[1].score);
for (const [s, t] of live) console.log(s.padEnd(18), t.score, t.label, t.mentions24h, t.mentions7d, t.velocity);
