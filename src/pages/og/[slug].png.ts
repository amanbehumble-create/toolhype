import type { APIRoute } from 'astro'; import sharp from 'sharp';
import { getTools, getCommunities, byBuzz, toolsIn, LABEL, SITE, type Tool } from '../../lib/data';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const wrap = (s: string, n: number, max: number) => { const out: string[] = []; let l = ''; for (const w of s.split(/\s+/)) { if ((l + ' ' + w).trim().length > n) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); return out.slice(0, max); };
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n));
const F = 'DejaVu Sans, sans-serif';
type Card = { name: string; score: number; label?: string; mentions?: number };
const leadCard = (t?: Tool): Card | null => (t && t.buzz.score != null ? { name: t.name, score: t.buzz.score, label: t.buzz.label, mentions: t.buzz.mentions24h } : null);
const topLive = () => [...getTools()].filter((t) => t.buzz.score != null).sort(byBuzz)[0];

export const getStaticPaths = () => {
  const lead = leadCard(topLive());
  return [
    { params: { slug: 'default' }, props: { title: 'AI tools ranked by builders and buzz on X', sub: SITE.tagline, card: lead, showName: true } },
    { params: { slug: 'trending' }, props: { title: 'Trending AI tools today', sub: 'Ranked by live X Buzz Score', card: lead, showName: true } },
    ...getCommunities().map((c) => {
      const top = [...toolsIn(c.slug)].sort(byBuzz)[0];
      return { params: { slug: `best-${c.slug}` }, props: { title: `Best AI tools for ${c.name}`, sub: c.description, card: leadCard(top), showName: true } };
    }),
    ...getTools().map((t) => ({ params: { slug: `tool-${t.slug}` }, props: { title: t.name, sub: t.verdict, card: leadCard(t), showName: false } })),
  ];
};

const cardSvg = (card: Card, showName: boolean) => {
  const name = card.name.length > 26 ? card.name.slice(0, 25) + '…' : card.name;
  const label = LABEL[card.label || ''] || '';
  const posts = card.mentions ? `${compact(card.mentions)} posts in 24h` : '';
  const meter = Math.max(8, Math.round((card.score / 100) * 312));
  return `<g>
<rect x="728" y="132" width="400" height="390" rx="28" fill="#ffffff"/>
<text x="768" y="196" font-family="${F}" font-size="18" font-weight="bold" letter-spacing="2.4" fill="#00749e">X BUZZ</text>
<text x="768" y="328" font-family="${F}" font-size="120" font-weight="bold" fill="#000">${card.score}</text>
<text x="768" y="368" font-family="${F}" font-size="24" fill="#616161">/100${label ? ` · ${esc(label)}` : ''}</text>
<rect x="768" y="394" width="312" height="10" rx="5" fill="#f0f0f0"/>
<rect x="768" y="394" width="${meter}" height="10" rx="5" fill="#00bbff"/>
${showName ? `<text x="768" y="452" font-family="${F}" font-size="28" font-weight="bold" fill="#000">${esc(name)}</text>` : ''}
${posts ? `<text x="768" y="${showName ? 488 : 456}" font-family="${F}" font-size="20" fill="#616161">${esc(posts)}</text>` : ''}
</g>`;
};

export const GET: APIRoute = async ({ props }) => {
  const { title, sub, card, showName } = props as { title: string; sub: string; card: Card | null; showName: boolean };
  const wide = !card;
  const tl = wrap(title, wide ? 26 : 18, 3);
  const sl = wrap(sub, wide ? 52 : 36, 3);
  const titleSize = tl.some((l) => l.length > 22) ? 52 : 60;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#000"/><rect width="1200" height="8" fill="#00bbff"/>
<text x="72" y="96" font-family="${F}" font-size="34" fill="#fff">tool<tspan font-weight="bold" fill="#00bbff">hype</tspan></text>
${tl.map((l, i) => `<text x="72" y="${210 + i * (titleSize + 10)}" font-family="${F}" font-weight="bold" font-size="${titleSize}" fill="#fff">${esc(l)}</text>`).join('')}
${sl.map((l, i) => `<text x="72" y="${210 + tl.length * (titleSize + 10) + 28 + i * 36}" font-family="${F}" font-size="26" fill="#a3a3a3">${esc(l)}</text>`).join('')}
<text x="72" y="580" font-family="${F}" font-size="22" fill="#7a7a7a">toolhype.dev</text>
${card ? cardSvg(card, showName) : ''}
</svg>`;
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
