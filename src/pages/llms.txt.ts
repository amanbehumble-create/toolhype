import type { APIRoute } from 'astro'; import { getCommunities, toolsIn, SITE } from '../lib/data';
export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  const out = [`# ${SITE.name}`, '', `> ${SITE.tagline}. A Reddit-style directory of AI tools grouped by use case, with honest one-line verdicts. Full data: ${u('/llms-full.txt')}`, ''];
  for (const c of getCommunities()) {
    out.push(`## ${c.name} (${u('/c/' + c.slug)})`, '');
    for (const t of toolsIn(c.slug)) out.push(`- [${t.name}](${u('/tools/' + t.slug)}): ${t.verdict}`);
    out.push('');
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
