// Adds released daily-drip creator pages to the static sitemap. Unreleased/parked creators are never listed.
import { type Env, releasedBadges } from './_lib/drip';
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const res = await ctx.next();
  if (!res.ok) return res;
  const xml = await res.text();
  const urls = (await releasedBadges(ctx.env)).map((c) => `<url><loc>https://toolhype.dev/creators/${c.handle}</loc><lastmod>${c.unlocked}</lastmod></url>`).join('\n');
  return new Response(urls ? xml.replace('</urlset>', `${urls}\n</urlset>`) : xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate' } });
};
