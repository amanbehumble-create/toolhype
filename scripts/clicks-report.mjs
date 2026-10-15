#!/usr/bin/env node
// Private click stats (needs your Cloudflare login: `npx wrangler login`). Usage: node scripts/clicks-report.mjs [tool-slug]
import { execFileSync } from 'node:child_process';
const slug = process.argv[2];
const where = slug ? `WHERE tool_slug = '${slug.replace(/[^a-z0-9-]/gi, '')}'` : '';
const sql = `SELECT tool_slug,
 SUM(ts >= strftime('%Y-%m-%dT%H:%M:%SZ','now','-1 day')) AS last_24h,
 SUM(ts >= strftime('%Y-%m-%dT%H:%M:%SZ','now','-7 days')) AS last_7d,
 SUM(ts >= strftime('%Y-%m-%dT%H:%M:%SZ','now','-30 days')) AS last_30d,
 COUNT(DISTINCT ip_hash) AS unique_visitor_days, COUNT(*) AS all_time
 FROM clicks ${where} GROUP BY tool_slug ORDER BY last_7d DESC, all_time DESC`;
const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'toolhype-clicks', '--remote', '--json', '--command', sql], { encoding: 'utf8' });
const rows = JSON.parse(out)[0]?.results || [];
console.table(rows);
