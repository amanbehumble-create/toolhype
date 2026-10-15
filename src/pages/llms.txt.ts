import type { APIRoute } from 'astro'; import { getCommunities, toolsIn, SITE, trendingOnX, BUZZ_AT } from '../lib/data';
export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  const out = [`# ${SITE.name}`, '', `> ${SITE.tagline}. A Reddit-style directory of AI tools grouped by use case, with honest one-line verdicts. Full data: ${u('/llms-full.txt')}`, ''];
  out.push(`## Trending on X now (Live X Buzz Score, updated ${BUZZ_AT}; method: ${u('/buzz')})`, '', ...trendingOnX(10).map((t) => `- [${t.name}](${u('/tools/' + t.slug)}): ${t.buzz.score}/100, ${t.buzz.mentions24h} posts in 24h, ${t.buzz.mentions7d} in 7d, ${t.buzz.velocity}x velocity, ${t.buzz.label}`), '');
  for (const c of getCommunities()) {
    out.push(`## ${c.name} (${u('/c/' + c.slug)})`, '');
    for (const t of toolsIn(c.slug)) out.push(`- [${t.name}](${u('/tools/' + t.slug)}): ${t.verdict}${t.buzz.status === 'live' ? ` (X Buzz ${t.buzz.score}/100, ${t.buzz.label})` : ''}`);
    out.push('');
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
