import type { APIRoute } from 'astro'; import sharp from 'sharp';
import { getTools, getCommunities, SITE } from '../../lib/data';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const wrap = (s: string, n: number, max: number) => { const out: string[] = []; let l = ''; for (const w of s.split(/\s+/)) { if ((l + ' ' + w).trim().length > n) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); return out.slice(0, max); };
export const getStaticPaths = () => [
  { params: { slug: 'default' }, props: { title: 'AI tools ranked by builders and buzz on X', sub: SITE.tagline } },
  { params: { slug: 'trending' }, props: { title: 'Trending AI tools today', sub: 'Ranked by live X Buzz Score' } },
  ...getCommunities().map((c) => ({ params: { slug: `best-${c.slug}` }, props: { title: `Best AI tools for ${c.name}`, sub: c.description } })),
  ...getTools().map((t) => ({ params: { slug: `tool-${t.slug}` }, props: { title: t.name, sub: t.verdict } })),
];
export const GET: APIRoute = async ({ props }) => {
  const { title, sub } = props as { title: string; sub: string };
  const tl = wrap(title, 28, 2), sl = wrap(sub, 52, 3);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0f0f12"/><rect x="0" y="0" width="1200" height="10" fill="#ff5a1f"/>
<text x="80" y="120" font-family="DejaVu Sans, sans-serif" font-size="40" fill="#fff">tool<tspan font-weight="bold" fill="#ff5a1f">hype</tspan></text>
${tl.map((l, i) => `<text x="80" y="${250 + i * 84}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="72" fill="#fff">${esc(l)}</text>`).join('')}
${sl.map((l, i) => `<text x="80" y="${250 + tl.length * 84 + 20 + i * 46}" font-family="DejaVu Sans, sans-serif" font-size="34" fill="#b8b8c2">${esc(l)}</text>`).join('')}
<text x="80" y="580" font-family="DejaVu Sans, sans-serif" font-size="28" fill="#8a8a96">toolhype.dev</text></svg>`;
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toBuffer();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
