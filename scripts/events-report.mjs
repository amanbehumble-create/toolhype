#!/usr/bin/env node
// Private on-site interaction stats from D1 `events` (needs `npx wrangler login`). Usage: node scripts/events-report.mjs [days=7]
import { execFileSync } from 'node:child_process';
const days = Math.max(1, Math.min(90, parseInt(process.argv[2] || '7', 10) || 7));
const since = `strftime('%Y-%m-%dT%H:%M:%SZ','now','-${days} days')`;
const q = (sql) => JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'toolhype-clicks', '--remote', '--json', '--command', sql], { encoding: 'utf8' }))[0]?.results || [];
console.log(`\nDaily pageviews / unique visitors (UTC days, last ${days}d)`);
console.table(q(`SELECT substr(ts,1,10) AS day, SUM(kind='view') AS pageviews, COUNT(DISTINCT CASE WHEN kind='view' THEN ip_hash END) AS visitors, SUM(kind='click') AS clicks FROM events WHERE ts >= ${since} GROUP BY day ORDER BY day DESC`));
console.log('\nPageviews by page (with click-through = clicks / views)');
console.table(q(`SELECT page, SUM(kind='view') AS views, SUM(kind='click') AS clicks, ROUND(100.0*SUM(kind='click')/MAX(SUM(kind='view'),1),1) AS ctr_pct FROM events WHERE ts >= ${since} GROUP BY page ORDER BY views DESC LIMIT 40`));
console.log('\nTop clicked elements by page');
console.table(q(`SELECT page, element, kind, COUNT(*) AS n FROM events WHERE kind IN ('click','submit') AND ts >= ${since} GROUP BY page, element, kind ORDER BY n DESC LIMIT 50`));
console.log('\nTop searches');
console.table(q(`SELECT lower(label) AS term, COUNT(*) AS n FROM events WHERE kind='search' AND ts >= ${since} GROUP BY term ORDER BY n DESC LIMIT 20`));
console.log('\nTraffic sources (referrer host on pageviews; [ref:…] = tagged link, e.g. ?ref=x)');
console.table(q(`SELECT COALESCE(label,'(direct)') || CASE WHEN element LIKE 'ref:%' THEN ' [' || element || ']' ELSE '' END AS referrer, COUNT(*) AS n, COUNT(DISTINCT ip_hash) AS visitors FROM events WHERE kind='view' AND ts >= ${since} GROUP BY referrer ORDER BY n DESC LIMIT 25`));
console.log('\nTagged links (?ref=…): landings, visitors, and submissions from those sessions');
console.table(q(`SELECT substr(v.ref,5) AS ref, v.landings, v.visitors, COALESCE(s.submits,0) AS submits FROM (SELECT element AS ref, COUNT(*) AS landings, COUNT(DISTINCT ip_hash) AS visitors FROM events WHERE kind='view' AND element LIKE 'ref:%' AND ts >= ${since} GROUP BY element) v LEFT JOIN (SELECT label AS ref, COUNT(*) AS submits FROM events WHERE kind='submit' AND label LIKE 'ref:%' AND ts >= ${since} GROUP BY label) s ON s.ref = v.ref ORDER BY v.landings DESC`));
console.log('\nShare buttons used');
console.table(q(`SELECT element, COUNT(*) AS n FROM events WHERE kind='click' AND element LIKE 'share:%' AND ts >= ${since} GROUP BY element ORDER BY n DESC LIMIT 20`));
