#!/usr/bin/env node
// Ping IndexNow (Bing, Yandex, Seznam, Naver...) with ONLY the URLs that changed. Run AFTER the deploy is live.
// Usage: node scripts/indexnow-changed.mjs /hype /vs/chatgpt-vs-claude ...   (explicit paths)
//        node scripts/indexnow-changed.mjs --since <git-ref>                   (derive from changed files)
//        add --dry to print without sending
// Key file: public/7c2824b792163d3239080ca91f147428.txt (served at https://toolhype.dev/<key>.txt)
import { execFileSync } from 'node:child_process';
const HOST = 'toolhype.dev', KEY = '7c2824b792163d3239080ca91f147428';
const args = process.argv.slice(2); const dry = args.includes('--dry');
let paths = args.filter((a) => a.startsWith('/'));
const si = args.indexOf('--since');
if (si >= 0) {
  const files = execFileSync('git', ['diff', '--name-only', args[si + 1], 'HEAD'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const set = new Set();
  for (const f of files) {
    if (/^src\/data\/(tools|buzz)\.json$/.test(f) || f.startsWith('src/lib/') || f.startsWith('src/components/') || f.startsWith('src/layouts/')) ['/', '/trending', '/hype', '/new', '/buzz', '/llms.txt', '/llms-full.txt'].forEach((p) => set.add(p));
    const m = f.match(/^src\/pages\/(.+)\.(astro|ts)$/);
    if (m && !m[1].includes('[')) set.add('/' + m[1].replace(/(^|\/)index$/, '').replace(/\.txt$|\.xml$/, (x) => x));
  }
  if ([...files].some((f) => /src\/(data|lib|components|layouts|pages\/(tools|vs|best|hype))/.test(f))) {
    const sm = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
    for (const m of sm.matchAll(/<loc>https:\/\/[^/]+(\/[^<]*)<\/loc>/g)) if (/^\/(tools|vs|best|hype)\b/.test(m[1])) set.add(m[1]);
  }
  paths.push(...set);
}
const urlList = [...new Set(paths)].map((p) => `https://${HOST}${p === '/' ? '/' : p}`).slice(0, 10000);
if (!urlList.length) { console.log('No URLs. Pass paths or --since <ref>.'); process.exit(0); }
console.log(urlList.length, 'URLs'); if (dry) { console.log(urlList.join('\n')); process.exit(0); }
const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }) });
console.log('IndexNow HTTP', res.status, await res.text());
