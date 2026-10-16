#!/usr/bin/env node
// Freeze this ISO week's "most hyped" top 10 into src/data/hype/<week>.json so /hype/<week> stays stable after the week ends.
// Run after the last buzz refresh of the week (e.g. Sunday). Usage: node scripts/hype-snapshot.mjs
import fs from 'node:fs';
const tools = JSON.parse(fs.readFileSync('src/data/tools.json', 'utf8'));
const buzz = JSON.parse(fs.readFileSync('src/data/buzz.json', 'utf8'));
const d = new Date(buzz.computedAt); const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); const y = t.getUTCFullYear();
const week = `${y}-w${String(Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7)).padStart(2, '0')}`;
const rows = tools.map((x) => ({ x, b: buzz.tools[x.slug] })).filter(({ b }) => b?.status === 'live').sort((p, q) => q.b.score - p.b.score).slice(0, 10).map(({ x, b }) => {
  const p = b.topPosts?.[0];
  return { slug: x.slug, name: x.name, score: b.score, mentions7d: b.mentions7d, mentions24h: b.mentions24h, velocity: b.velocity, label: b.label, verdict: x.verdict,
    why: `${b.mentions7d.toLocaleString('en-US')} X posts in 7 days (${b.mentions24h} in the last 24h, ${b.velocity}x velocity)` + (p ? `; top post by @${p.author ?? 'x'} got ${p.likes.toLocaleString('en-US')} likes` : '') + '.' };
});
fs.mkdirSync('src/data/hype', { recursive: true });
fs.writeFileSync(`src/data/hype/${week}.json`, JSON.stringify({ week, computedAt: buzz.computedAt, rows }, null, 1) + '\n');
console.log('wrote', `src/data/hype/${week}.json`);
