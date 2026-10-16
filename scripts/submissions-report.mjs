#!/usr/bin/env node
// Private tool submissions (needs `npx wrangler login`). Usage: node scripts/submissions-report.mjs [status]   (default: all)
import { execFileSync } from 'node:child_process';
const st = (process.argv[2] || '').replace(/[^a-z]/g, '');
const sql = `SELECT id, ts, name, url, email, x_handle, status, country, substr(pitch,1,120) AS pitch FROM submissions ${st ? `WHERE status = '${st}'` : ''} ORDER BY ts DESC LIMIT 200`;
const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'toolhype-clicks', '--remote', '--json', '--command', sql], { encoding: 'utf8' });
console.table(JSON.parse(out)[0]?.results || []);
