// Public, aggregate-only: total number of tool submissions. Never returns any submission data.
// Excludes our own test rows (submissions pointing at toolhype.dev itself).
interface Env { DB?: D1Database }
const H = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, s-maxage=300', 'Access-Control-Allow-Origin': '*' };
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const cache = (caches as any).default as Cache;
  const key = new Request(new URL('/api/submissions-count', ctx.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  if (!ctx.env.DB) return new Response(JSON.stringify({ count: null }), { status: 503, headers: { ...H, 'Cache-Control': 'no-store' } });
  try {
    const r = await ctx.env.DB.prepare("SELECT COUNT(*) AS n FROM submissions WHERE url NOT LIKE '%toolhype.dev%' AND url NOT LIKE '%toolhype.pages.dev%'").first<{ n: number }>();
    const res = new Response(JSON.stringify({ count: Number(r?.n ?? 0) }), { headers: H });
    ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (e) {
    console.error('count failed', e);
    return new Response(JSON.stringify({ count: null }), { status: 500, headers: { ...H, 'Cache-Control': 'no-store' } });
  }
};
