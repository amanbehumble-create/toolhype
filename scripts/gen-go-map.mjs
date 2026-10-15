// Build-time map slug -> official (or affiliate) URL for /go/<slug>. Only known tools can redirect.
import { readFileSync, writeFileSync } from 'node:fs';
const tools = JSON.parse(readFileSync(new URL('../src/data/tools.json', import.meta.url)));
const map = {};
for (const t of tools) { const u = t.affiliateUrl || t.url; if (t.slug && /^https?:\/\//.test(u || '')) map[t.slug] = u; }
writeFileSync(new URL('../functions/go/_map.json', import.meta.url), JSON.stringify(map, null, 1) + '\n');
console.log(`go map: ${Object.keys(map).length} tools`);
