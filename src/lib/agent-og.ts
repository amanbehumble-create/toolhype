// 1200x630 Open Graph cards for the Grok Bot agents section (rendered at build time with sharp; no third parties).
import sharp from 'sharp';
import { getAgents, agentCategories, creatorLabel, type Agent } from './agents';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const wrap = (s: string, n: number, max: number) => { const out: string[] = []; let l = ''; for (const w of s.split(/\s+/)) { if ((l + ' ' + w).trim().length > n) { if (l) out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); if (out.length > max) { out.length = max; out[max - 1] = out[max - 1].replace(/\s*\S*$/, '') + '…'; } return out; };
const F = 'DejaVu Sans, sans-serif';
const frame = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0d12"/><stop offset="1" stop-color="#1c1018"/></linearGradient>
<radialGradient id="glow" cx="0.85" cy="0.15" r="0.6"><stop offset="0" stop-color="#ff5a1f" stop-opacity="0.28"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient>
<pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#ffffff" fill-opacity="0.05"/></pattern></defs>
<rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#dots)"/><rect width="1200" height="630" fill="url(#glow)"/><rect width="1200" height="8" fill="#ff5a1f"/>
<text x="72" y="96" font-family="${F}" font-size="36" fill="#fff">tool<tspan font-weight="bold" fill="#ff5a1f">hype</tspan></text>
${inner}</svg>`;
const pill = (x: number, y: number, label: string) => { const w = 24 + label.length * 13.2; return `<rect x="${x}" y="${y}" width="${w}" height="40" rx="20" fill="#ff5a1f" fill-opacity="0.14" stroke="#ff5a1f" stroke-opacity="0.7"/><text x="${x + 12}" y="${y + 27}" font-family="${F}" font-size="19" font-weight="bold" letter-spacing="1.5" fill="#ff8a5c">${esc(label)}</text>`; };
const png = (svg: string) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

export function sectionOg() {
  const agents = getAgents(); const top = agents.slice(0, 4);
  const all = agentCategories(); const cats = all.slice(0, 4).join('  ·  ') + (all.length > 4 ? `  ·  +${all.length - 4} more` : '');
  const cards = top.map((a, i) => { const y = 150 + i * 104, x = 742 + (i % 2) * 18;
    return `<g><rect x="${x}" y="${y}" width="392" height="88" rx="16" fill="#17171f" stroke="#ffffff" stroke-opacity="0.12"/>
<rect x="${x + 18}" y="${y + 22}" width="44" height="44" rx="12" fill="#ff5a1f" fill-opacity="${0.9 - i * 0.15}"/><text x="${x + 40}" y="${y + 53}" text-anchor="middle" font-family="${F}" font-size="22" font-weight="bold" fill="#0d0d12">${esc(a.name[0])}</text>
<text x="${x + 78}" y="${y + 40}" font-family="${F}" font-size="23" font-weight="bold" fill="#fff">${esc(a.name.length > 22 ? a.name.slice(0, 21) + '…' : a.name)}</text>
<text x="${x + 78}" y="${y + 68}" font-family="${F}" font-size="17" fill="#9a9aa8">${esc(a.category)} · ${esc(creatorLabel(a))}</text></g>`; }).join('');
  return png(frame(`${pill(72, 150, 'GROK BOT AGENTS')}
<text x="72" y="268" font-family="${F}" font-size="66" font-weight="bold" fill="#fff">Ready-to-use</text>
<text x="72" y="346" font-family="${F}" font-size="66" font-weight="bold" fill="#fff">Grok Bot <tspan fill="#ff5a1f">agents</tspan></text>
<text x="72" y="406" font-family="${F}" font-size="28" fill="#c4c4ce">${agents.length} free templates. Add one in a click.</text>
<text x="72" y="452" font-family="${F}" font-size="20" fill="#8a8a96">${esc(cats)}</text>
<rect x="72" y="500" width="300" height="56" rx="28" fill="#ff5a1f"/><text x="222" y="536" text-anchor="middle" font-family="${F}" font-size="22" font-weight="bold" fill="#0d0d12">Browse the agents →</text>
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
<text x="72" y="${by}" font-family="${F}" font-size="24" fill="#ff8a5c">by ${esc(creatorLabel(a))}</text>
<rect x="72" y="522" width="350" height="56" rx="28" fill="#ff5a1f"/><text x="247" y="558" text-anchor="middle" font-family="${F}" font-size="22" font-weight="bold" fill="#0d0d12">Add to Grok Bot, free ↗</text>
<text x="1128" y="562" text-anchor="end" font-family="${F}" font-size="22" fill="#8a8a96">toolhype.dev/grok-bot-agents</text>`));
}
