#!/usr/bin/env node
// Checks the catalog shape and that live buzz scores still match scripts/buzz.mjs (method v1).
// Does not call X. A failing score means the stored inputs and the stored score disagree.
import fs from 'node:fs';

const tools = JSON.parse(fs.readFileSync(new URL('../src/data/tools.json', import.meta.url)));
const buzz = JSON.parse(fs.readFileSync(new URL('../src/data/buzz.json', import.meta.url)));
const queries = JSON.parse(fs.readFileSync(new URL('../scripts/buzz-queries.json', import.meta.url)));
const communities = JSON.parse(fs.readFileSync(new URL('../src/data/communities.json', import.meta.url)));
const errors = [];
const fail = (m) => errors.push(m);

const ADDED = ['macswarm', 'vertov', 'cadprops', 'open-agent-api', 'openlegion', 'spreadsheet-to-app', 'reelsdk', 'queststudio', 'tiquo', 'aicertmock', 'antigravity'];
const norm = (u) => String(u || '').trim().replace(/\/+$/, '').toLowerCase().replace(/^https?:\/\/www\./, 'https://');
const KNOWN_URL_DUPES = new Set(['https://openai.com/index/introducing-gpt-6-2-astra-sol']);
const PRICING = /^(free|freemium|paid|open-source|open-weight|pricing not published)$|^paid \(.+\)$/;
const useCaseOk = new Set([...communities.map((c) => c.slug), 'writing']);
const cats = new Set(communities.map((c) => c.slug));

if (tools.length !== 308) fail(`expected 308 tools, found ${tools.length}`);
if (buzz.method !== 'v1') fail(`buzz method is ${buzz.method}`);
const FULL_SCAN = '2026-11-25T01:30:49.503Z';
const RESCAN_AT = '2026-11-25T13:55:41.319Z';
// Leaders rescanned together. The board stamp stays on the last full scan.
const RESCAN = new Set(['chatgpt','claude-code','claude','taan','grok','claude-duet','heygen','claude-ship','gemini-api-cli','capcut','gemini-4-neon','gemini','suno','gpt-6-2-sol','openbot','claude-fable-5-2','canva','gpt-6-2-astra','base44','magi-2','antigravity','opencode','higgsfield','midjourney','cursor','codex']);
if (buzz.computedAt !== FULL_SCAN) fail(`board computedAt ${buzz.computedAt} should stay the full-scan stamp`);
for (const [slug, t] of Object.entries(buzz.tools)) {
  if (t.status !== 'live' || RESCAN.has(slug)) continue;
  if (t.computedAt !== FULL_SCAN) fail(`${slug} computedAt changed from the 01:30Z scan: ${t.computedAt}`);
}

const slugs = new Map();
const urls = new Map();
for (const t of tools) {
  for (const k of ['slug', 'name', 'url', 'category', 'pricing', 'verdict', 'useThisIf', 'source', 'addedAt']) {
    if (typeof t[k] !== 'string' || !t[k].trim()) fail(`${t.slug || '?'} missing ${k}`);
  }
  if (!Array.isArray(t.useCases) || t.useCases.length === 0) fail(`${t.slug} useCases`);
  if (!Array.isArray(t.alternatives)) fail(`${t.slug} alternatives`);
  if (t.affiliateUrl !== null && typeof t.affiliateUrl !== 'string') fail(`${t.slug} affiliateUrl`);
  if (typeof t.featured !== 'boolean') fail(`${t.slug} featured`);
  if (!PRICING.test(t.pricing)) fail(`${t.slug} pricing ${t.pricing}`);
  if (!cats.has(t.category)) fail(`${t.slug} category ${t.category}`);
  for (const u of t.useCases) if (!useCaseOk.has(u)) fail(`${t.slug} use case ${u}`);
  if (!/^https:\/\//.test(t.url)) fail(`${t.slug} url ${t.url}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.addedAt)) fail(`${t.slug} addedAt ${t.addedAt}`);
  slugs.set(t.slug, (slugs.get(t.slug) || 0) + 1);
  const n = norm(t.url);
  urls.set(n, [...(urls.get(n) || []), t.slug]);
  if (ADDED.includes(t.slug) && /24\s*,?000 real visitors|24k real|submitter|mail\.grokbot|\b\d{1,3}(?:\.\d{1,3}){3}\b/i.test(`${t.verdict} ${t.useThisIf}`)) {
    fail(`${t.slug} includes a private audit detail or an unverified traffic claim`);
  }
  if (!queries[t.slug]) fail(`${t.slug} has no buzz query`);
}
for (const [s, n] of slugs) if (n !== 1) fail(`slug ${s} appears ${n} times`);
for (const [u, list] of urls) {
  if (list.length > 1 && !KNOWN_URL_DUPES.has(u)) fail(`url ${u} used by ${list.join(', ')}`);
}
const bySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));
for (const t of tools) for (const a of t.alternatives) if (!bySlug[a]) fail(`${t.slug} alternative ${a} missing`);

for (const slug of ADDED) {
  const n = slugs.get(slug) || 0;
  if (n !== 1) fail(`${slug} count ${n}`);
  const t = bySlug[slug];
  if (!t) continue;
  if (slug !== 'gemini-4-neon' && t.addedAt !== '2026-11-25') fail(`${slug} addedAt ${t.addedAt}`);
  if (!fs.existsSync(new URL(`../public${t.logo}`, import.meta.url))) fail(`${slug} logo missing`);
}
const gem = bySlug['gemini-4-neon'];
if (!gem) fail('gemini-4-neon missing');
else if (gem.addedAt !== '2026-11-19') fail(`gemini-4-neon addedAt changed to ${gem.addedAt}`);
if ((slugs.get('gemini-4-neon') || 0) !== 1) fail('gemini-4-neon duplicated');
if (bySlug.antigravity?.url !== 'https://antigravity.google') fail(`antigravity url ${bySlug.antigravity?.url}`);
if (bySlug.antigravity?.pricing !== 'freemium') fail('antigravity pricing');
if (bySlug.openlegion?.pricing !== 'pricing not published') fail('openlegion pricing must stay unpublished');
if (/\b(free|paid)\b/i.test(bySlug.openlegion?.pricing || '')) fail('openlegion pricing enum invented');

function scoreOf(t) {
  const m7 = t.mentions7d, m24 = t.mentions24h, velocity = t.velocity;
  const vol = Math.min(50, (Math.log10(1 + m7) / 5) * 50);
  const vel = Math.min(25, Math.max(0, Math.log2(Math.max(velocity, 1)) * 12.5)) * Math.min(1, Math.log10(1 + m24) / 2);
  const quotes = (t.topPosts || []).reduce((a, p) => a + (p.quotes || 0), 0);
  const eng = t.sample.likes + 3 * t.sample.reposts + 2 * t.sample.replies + quotes * 2;
  const en = Math.min(25, (Math.log10(1 + eng) / 5) * 25);
  return {
    score: Math.round(vol + vel + en),
    volume: +vol.toFixed(1),
    velocity: +vel.toFixed(1),
    engagement: +en.toFixed(1),
    viral: (t.topPosts || []).some((p) => p.likes >= 5000),
  };
}

for (const slug of RESCAN) {
  const t = buzz.tools[slug];
  if (!t || t.status !== 'live') { fail(`${slug} buzz is not live`); continue; }
  if (t.query !== queries[slug]) fail(`${slug} buzz query does not match buzz-queries.json`);
  if (t.sample.likes === t.mentions7d || t.sample.posts === t.mentions7d) fail(`${slug} sample was set from mention counts`);
  if (t.priorDailyAvg >= 10) {
    const again = +(t.mentions24h / t.priorDailyAvg).toFixed(2);
    if (Math.abs(again - t.velocity) > 0.02) fail(`${slug} velocity ${t.velocity} does not follow mentions24h / priorDailyAvg (${again})`);
  }
  const got = scoreOf(t);
  if (got.score !== t.score) fail(`${slug} score ${t.score} != formula ${got.score}`);
  if (got.volume !== t.parts.volume || got.velocity !== t.parts.velocity || got.engagement !== t.parts.engagement) {
    fail(`${slug} parts ${JSON.stringify(t.parts)} != ${JSON.stringify(got)}`);
  }
  const label = (t.velocity >= 2 && t.mentions24h >= 20) || got.viral ? 'hype' : t.velocity >= 1.3 && t.mentions24h >= 5 ? 'rising' : t.mentions7d >= 50 ? 'steady' : 'quiet';
  if (t.label !== label || t.viral !== got.viral) fail(`${slug} label ${t.label}/${t.viral} != ${label}/${got.viral}`);
  if (t.computedAt !== RESCAN_AT) fail(`${slug} computedAt ${t.computedAt} is not the shared rescan`);
}

for (const slug of ADDED) {
  if (slug === 'antigravity') continue;
  const t = buzz.tools[slug];
  if (!t || t.status !== 'pending') fail(`${slug} should stay pending, no fabricated score`);
  if (t && (t.score != null || t.mentions7d != null || t.velocity != null || t.computedAt)) fail(`${slug} pending entry has score fields`);
  if (t && t.query !== queries[slug]) fail(`${slug} pending query mismatch`);
}

const live = Object.values(buzz.tools).filter((t) => t.status === 'live');
if (live.length < 290) fail(`live buzz count dropped to ${live.length}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`ok tools=${tools.length} liveBuzz=${live.length} added=${ADDED.length}`);
