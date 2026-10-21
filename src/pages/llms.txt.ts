import type { APIRoute } from 'astro'; import { getCommunities, toolsIn, SITE, trendingOnX, BUZZ_AT, newThisWeek } from '../lib/data'; import { getIssues } from '../lib/prompts'; import { getPairs, currentHype } from '../lib/geo'; import { getAgents, AGENTS_INTRO } from '../lib/agents';
import vsNotes from '../data/vs-notes.json';
export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  const out = [`# ${SITE.name}`, '', `> ${SITE.tagline}. A Reddit-style directory of AI tools grouped by use case, with honest one-line verdicts. Full data: ${u('/llms-full.txt')}`, '', `Key pages: [Trending AI tools today](${u('/trending')}), [Best AI tools by category](${u('/best')}), ${getCommunities().map((c) => `[Best AI tools for ${c.name.toLowerCase()}](${u('/best/' + c.slug)})`).join(', ')}`, ''];
  const h = currentHype(); out.push(`## Most hyped AI tools this week (${h.week}, ${u('/hype')})`, '', ...h.rows.map((x, i) => `${i + 1}. [${x.name}](${u('/tools/' + x.slug)}): ${x.score}/100. ${x.why}`), '', '## Comparisons', '', ...getPairs().map((p) => `- [${p.a.name} vs ${p.b.name}](${u('/vs/' + p.slug)})` + ((vsNotes as Record<string, { description?: string }>)[p.slug]?.description ? `: ${(vsNotes as Record<string, { description?: string }>)[p.slug].description}` : '')), '');
  const fresh = newThisWeek(); const SRC: Record<string, string> = { producthunt: 'Product Hunt', ph: 'Product Hunt', github: 'GitHub', x: 'X', hackernews: 'Hacker News', submission: 'community submission', 'producthunt + x': 'Product Hunt + X' };
  if (fresh.length) out.push(`## New AI tools added this week (${fresh.length}, ${u('/new')})`, '', ...fresh.map((t) => `- [${t.name}](${u('/tools/' + t.slug)}) (added ${t.addedAt}${SRC[t.source] ? ', via ' + SRC[t.source] : ''}): ${t.verdict}`), '');
  out.push(`## Trending on X now (Live X Buzz Score, updated ${BUZZ_AT}; method: ${u('/buzz')})`, '', ...trendingOnX(10).map((t) => `- [${t.name}](${u('/tools/' + t.slug)}): ${t.buzz.score}/100, ${t.buzz.mentions24h} posts in 24h, ${t.buzz.mentions7d} in 7d, ${t.buzz.velocity}x velocity, ${t.buzz.label}`), '');
  out.push('## Prompt Drop (weekly copy-paste AI prompts for beginners, ' + u('/prompts') + ')', '');
  for (const i of getIssues()) { out.push(`### [${i.title}](${u('/prompts/' + i.slug)}) (${i.date})`, ''); for (const p of i.prompts) out.push(`- ${p.title} (${p.category}, works in ${p.tool}): "${p.prompt.replace(/\n+/g, ' ')}" Why: ${p.why} Source: ${p.source} (${p.author}, ${p.likes} likes as of ${p.likesAsOf})`); out.push(''); }
  out.push(`## Grok Bot agents (${AGENTS_INTRO} ${u('/grok-bot-agents')})`, '', ...getAgents().map((a) => `- [${a.name}](${u('/grok-bot-agents/' + a.slug)}) (${a.category}, by ${a.creatorHandle ? '@' + a.creatorHandle : a.creatorName ?? 'unknown'}): ${a.description} Template: ${a.templateUrl}`), '');
  for (const c of getCommunities()) {
    out.push(`## ${c.name} (${u('/c/' + c.slug)})`, '');
    for (const t of toolsIn(c.slug)) out.push(`- [${t.name}](${u('/tools/' + t.slug)}): ${t.verdict}${t.buzz.status === 'live' ? ` (X Buzz ${t.buzz.score}/100, ${t.buzz.label})` : ''}`);
    out.push('');
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
