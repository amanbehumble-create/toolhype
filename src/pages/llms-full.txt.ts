import type { APIRoute } from 'astro'; import { getTools, getTool, SITE } from '../lib/data'; import { getPairs } from '../lib/geo';
export const GET: APIRoute = ({ site }) => {
  const out = [`# ${SITE.name}: full tool index`, '', `> ${SITE.tagline}.`, ''];
  for (const t of getTools()) out.push(`## ${t.name}`, `- Page: ${new URL('/tools/' + t.slug, site)}`, `- Official site: ${t.url}`, `- Verdict: ${t.verdict}`, `- Use this if ${t.useThisIf}`, `- Use cases: ${t.useCases.join(', ')}`, `- Pricing: ${t.pricing}`, `- Alternatives: ${t.alternatives.map((a) => getTool(a)?.name).filter(Boolean).join(', ') || 'none listed'}`, `- X buzz score: ${t.buzz.score ?? 'pending'}`, '');
  out.push('# Comparisons', '');
  for (const p of getPairs()) out.push(`## ${p.a.name} vs ${p.b.name}`, `- Page: ${new URL('/vs/' + p.slug, site)}`, ...[p.a, p.b].map((t) => `- ${t.name}: ${t.pricing}; use cases ${t.useCases.join(', ')}; X buzz ${t.buzz.score ?? 'pending'}; ${t.verdict}`), '');
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
