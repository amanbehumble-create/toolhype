import type { APIRoute } from 'astro'; import { getTools, getCommunities } from '../lib/data';
export const GET: APIRoute = ({ site }) => {
  const paths = ['/', '/new', '/submit', '/newsletter', ...getCommunities().map((c) => `/c/${c.slug}`), ...getTools().map((t) => `/tools/${t.slug}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `<url><loc>${new URL(p, site)}</loc></url>`).join('\n')}\n</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
