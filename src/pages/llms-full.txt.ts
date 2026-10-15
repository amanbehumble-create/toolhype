import type { APIRoute } from 'astro'; import { getTools, getTool, SITE } from '../lib/data';
export const GET: APIRoute = ({ site }) => {
  const out = [`# ${SITE.name}: full tool index`, '', `> ${SITE.tagline}.`, ''];
  for (const t of getTools()) out.push(`## ${t.name}`, `- Page: ${new URL('/tools/' + t.slug, site)}`, `- Official site: ${t.url}`, `- Verdict: ${t.verdict}`, `- Use this if ${t.useThisIf}`, `- Use cases: ${t.useCases.join(', ')}`, `- Pricing: ${t.pricing}`, `- Alternatives: ${t.alternatives.map((a) => getTool(a)?.name).filter(Boolean).join(', ') || 'none listed'}`, `- X buzz score: ${t.buzz.score ?? 'pending'}`, '');
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
