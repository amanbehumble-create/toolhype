import type { APIRoute } from 'astro'; import { getTools, byNew } from '../lib/data';
const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);
export const GET: APIRoute = ({ site }) => {
  const items = [...getTools()].sort(byNew).slice(0, 30).map((t) => `<item><title>${esc(t.name)}</title><link>${new URL('/tools/' + t.slug, site)}</link><guid>${new URL('/tools/' + t.slug, site)}</guid><pubDate>${new Date(t.addedAt).toUTCString()}</pubDate><description>${esc(t.verdict)}</description></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>toolhype — New this week</title><link>${new URL('/new', site)}</link><description>New AI tools and software</description>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml' } });
};
