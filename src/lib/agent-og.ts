// 1200x630 Open Graph cards for the Grok Bot agents section (rendered at build time with sharp; no third parties).
import sharp from 'sharp';
import { getAgents, agentCategories, creatorLabel, type Agent } from './agents';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const wrap = (s: string, n: number, max: number) => { const out: string[] = []; let l = ''; for (const w of s.split(/\s+/)) { if ((l + ' ' + w).trim().length > n) { if (l) out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); if (out.length > max) { out.length = max; out[max - 1] = out[max - 1].replace(/\s*\S*$/, '') + '…'; } return out; };
const F = 'DejaVu Sans, sans-serif';
const frame = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#000"/><rect width="1200" height="8" fill="#00bbff"/>
<text x="72" y="96" font-family="${F}" font-size="36" fill="#fff">tool<tspan font-weight="bold" fill="#00bbff">hype</tspan></text>
${inner}</svg>`;
const pill = (x: number, y: number, label: string) => { const w = 24 + label.length * 13.2; return `<rect x="${x}" y="${y}" width="${w}" height="40" rx="20" fill="#00bbff" fill-opacity="0.12" stroke="#00bbff" stroke-opacity="0.85"/><text x="${x + 12}" y="${y + 27}" font-family="${F}" font-size="19" font-weight="bold" letter-spacing="1.5" fill="#00bbff">${esc(label)}</text>`; };
const png = (svg: string) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

export function sectionOg() {
  const agents = getAgents(); const top = agents.slice(0, 4);
  const all = agentCategories(); const cats = all.slice(0, 4).join('  ·  ') + (all.length > 4 ? `  ·  +${all.length - 4} more` : '');
  const cards = top.map((a, i) => { const y = 156 + i * 100;
    return `<g><rect x="742" y="${y}" width="390" height="86" rx="16" fill="#141414" stroke="#ffffff" stroke-opacity="0.12"/>
<text x="766" y="${y + 36}" font-family="${F}" font-size="23" font-weight="bold" fill="#fff">${esc(a.name.length > 24 ? a.name.slice(0, 23) + '…' : a.name)}</text>
<text x="766" y="${y + 64}" font-family="${F}" font-size="17" fill="#a3a3a3">${esc(a.category)} · ${esc(creatorLabel(a))}</text></g>`; }).join('');
  return png(frame(`${pill(72, 150, 'GROK BOT AGENTS')}
<text x="72" y="268" font-family="${F}" font-size="66" font-weight="bold" fill="#fff">Ready-to-use</text>
<text x="72" y="346" font-family="${F}" font-size="66" font-weight="bold" fill="#fff">Grok Bot <tspan fill="#00bbff">agents</tspan></text>
<text x="72" y="406" font-family="${F}" font-size="28" fill="#c4c4ce">${agents.length} free templates. Add one in a click.</text>
<text x="72" y="452" font-family="${F}" font-size="20" fill="#8a8a96">${esc(cats)}</text>
<rect x="72" y="500" width="300" height="56" rx="28" fill="#00bbff"/><text x="222" y="536" text-anchor="middle" font-family="${F}" font-size="22" font-weight="bold" fill="#000">Browse the agents →</text>
${cards}
<text x="1128" y="584" text-anchor="end" font-family="${F}" font-size="22" fill="#8a8a96">toolhype.dev/grok-bot-agents</text>`));
}

export function agentOg(a: Agent) {
  const tl = wrap(a.name, 20, 2), dl = wrap(a.description, 56, tl.length > 1 ? 2 : 3);
  const ty = 245, dy = ty + (tl.length - 1) * 80 + 64;
  const by = dy + (dl.length - 1) * 42 + 52;
  return png(frame(`${pill(72, 128, `GROK BOT AGENT · ${a.category.toUpperCase()}`)}
${tl.map((l, i) => `<text x="72" y="${ty + i * 80}" font-family="${F}" font-size="72" font-weight="bold" fill="#fff">${esc(l)}</text>`).join('')}
${dl.map((l, i) => `<text x="72" y="${dy + i * 42}" font-family="${F}" font-size="29" fill="#c4c4ce">${esc(l)}</text>`).join('')}
<text x="72" y="${by}" font-family="${F}" font-size="24" fill="#00bbff">by ${esc(creatorLabel(a))}</text>
<rect x="72" y="522" width="350" height="56" rx="28" fill="#00bbff"/><text x="247" y="558" text-anchor="middle" font-family="${F}" font-size="22" font-weight="bold" fill="#000">Add to Grok Bot, free ↗</text>
<text x="1128" y="562" text-anchor="end" font-family="${F}" font-size="22" fill="#8a8a96">toolhype.dev/grok-bot-agents</text>`));
}
