import type { APIRoute } from 'astro'; import { getTools, getCommunities, BUZZ_AT } from '../lib/data'; import { getPairs, allWeeks } from '../lib/geo'; import { getIssues } from '../lib/prompts';
export const GET: APIRoute = ({ site }) => {
  const today = (BUZZ_AT || new Date().toISOString()).slice(0, 10);
  const lm: Record<string, string> = Object.fromEntries(getTools().map((t) => [`/tools/${t.slug}`, t.addedAt]));
  const paths = ['/', '/trending', '/hype', ...allWeeks().map((w) => `/hype/${w.week}`), '/vs', ...getPairs().map((p) => `/vs/${p.slug}`), '/best', ...getCommunities().map((c) => `/best/${c.slug}`), '/new', '/buzz', '/submit', '/newsletter', '/prompts', ...getIssues().map((i) => `/prompts/${i.slug}`), ...getCommunities().map((c) => `/c/${c.slug}`), ...getTools().map((t) => `/tools/${t.slug}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `<url><loc>${new URL(p, site)}</loc><lastmod>${lm[p] ?? today}</lastmod></url>`).join('\n')}\n</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
