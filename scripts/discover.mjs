#!/usr/bin/env node
// Discovery pass: surfaces NEW tools/apps buzzing on X that are not in tools.json yet.
// Why: buzz.mjs only scores tools we already list, so anything we never heard of (e.g. a founder's viral launch
// video, or a Japanese-only hit) was invisible. This pass looks at high-engagement posts with links (EN + JA),
// X trends (JP/US) and X news stories, then groups by linked domain and ranks by views/engagement.
// Inputs: <rawDir>/discover/*.txt (see scripts/discover-queries.json). Output: scripts/candidates.json (for human
// review; nothing is auto-published). Usage: node scripts/discover.mjs [rawDir]
import fs from 'node:fs';
const rawDir = process.argv[2] || '/workspace/buzzraw';
const dir = `${rawDir}/discover`;
const cfg = JSON.parse(fs.readFileSync(new URL('./discover-queries.json', import.meta.url)));
const tools = JSON.parse(fs.readFileSync(new URL('../src/data/tools.json', import.meta.url)));
const json = (f) => { const s = fs.readFileSync(f, 'utf8'); const i = s.indexOf('{'); let d = 0, q = false, e = false;
  for (let j = i; j < s.length; j++) { const c = s[j]; if (q) { if (e) e = false; else if (c === '\\') e = true; else if (c === '"') q = false; continue; }
    if (c === '"') q = true; else if (c === '{') d++; else if (c === '}' && --d === 0) return JSON.parse(s.slice(i, j + 1)); } };
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } };
const known = new Set(tools.map((t) => host(t.url)).filter(Boolean));
const ignore = /(^|\.)(x\.com|twitter\.com|t\.co|youtube\.com|youtu\.be|instagram\.com|tiktok\.com|linkedin\.com|facebook\.com|github\.com|medium\.com|substack\.com|note\.com|amzn\.to|amazon\.(com|co\.jp)|bit\.ly|apple\.com|google\.com|nicovideo\.jp|pixiv\.net)$/;
const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
const byDomain = {};
for (const f of files.filter((f) => !/^(trends|news)/.test(f))) {
  const p = json(`${dir}/${f}`) || {}; const users = Object.fromEntries((p.includes?.users || []).map((u) => [u.id, u.username]));
  for (const x of p.data || []) {
    const m = x.public_metrics || {}; const eng = (m.like_count || 0) + 3 * (m.retweet_count || 0) + 2 * (m.reply_count || 0) + 2 * (m.quote_count || 0);
    const doms = [...new Set((x.entities?.urls || []).map((u) => host(u.unwound_url || u.expanded_url)).filter((h) => h && !ignore.test(h)))];
    for (const d of doms) {
      const k = byDomain[d] ||= { domain: d, known: known.has(d), posts: 0, views: 0, eng: 0, langs: new Set(), queries: new Set(), top: null };
      k.posts++; k.views += m.impression_count || 0; k.eng += eng; k.langs.add(x.lang); k.queries.add(f.replace('.txt', ''));
      if (!k.top || (m.impression_count || 0) > k.top.views) k.top = { url: `https://x.com/${users[x.author_id] || 'i'}/status/${x.id}`, views: m.impression_count || 0, likes: m.like_count || 0, text: (x.text || '').slice(0, 160) };
    }
  }
}
const cands = Object.values(byDomain).filter((c) => !c.known).map((c) => ({ ...c, langs: [...c.langs], queries: [...c.queries], hot: c.top.views >= cfg.minViews }))
  .sort((a, b) => b.views - a.views || b.eng - a.eng);
const trends = files.filter((f) => f.startsWith('trends')).flatMap((f) => (json(`${dir}/${f}`)?.data || []).map((t) => ({ region: f.slice(7, -4), name: t.trend_name })));
// Trend names that look like products/web toys (AI, game, simulator, quiz/診断) get flagged for a manual look.
const flagged = trends.filter((t) => /AI|GPT|Claude|Gemini|ゲーム|シミュ|診断|アプリ|app|game|\d+分の1/i.test(t.name));
const news = files.includes('news.txt') ? (json(`${dir}/news.txt`)?.data || []).map((n) => ({ name: n.name, summary: (n.summary || '').slice(0, 200) })) : [];
const out = { computedAt: new Date().toISOString(), candidates: cands.slice(0, 40), flaggedTrends: flagged, news };
fs.writeFileSync(new URL('./candidates.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(`candidates: ${cands.length} (hot >= ${cfg.minViews} views: ${cands.filter((c) => c.hot).length})`);
for (const c of cands.slice(0, 15)) console.log(c.hot ? '*' : ' ', c.domain.padEnd(28), c.views, c.eng, c.langs.join(','), c.top.url);
console.log('flagged trends:', flagged.map((t) => `${t.region}:${t.name}`).join(' | ') || 'none');
console.log('news:', news.map((n) => n.name).join(' | '));
