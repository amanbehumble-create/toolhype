// GET /api/visitors -> {total, source}. Real visitors since launch.
// Primary: Cloudflare Web Analytics (RUM, bots excluded) via GraphQL, needs encrypted Pages secret CF_ANALYTICS_TOKEN (Account Analytics: Read).
// Fallback: distinct (day, ip-hash) page views in our private D1 `events` table. Cached ~60s.
interface Env { DB?: D1Database; CF_ANALYTICS_TOKEN?: string }
const ACCOUNT = '3d1995dedade628b84880d98c2a2b601', SITE_TAG = '3a5234f2ccce48ebb799b6879432def4', LAUNCH = '2026-10-01';
async function rum(token: string): Promise<number | null> {
  const end = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const query = `query($a:String!,$s:String!,$f:Date!,$t:Date!){viewer{accounts(filter:{accountTag:$a}){rumPageloadEventsAdaptiveGroups(limit:1,filter:{siteTag:$s,date_geq:$f,date_leq:$t}){sum{visits}}}}}`;
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { a: ACCOUNT, s: SITE_TAG, f: LAUNCH, t: end } }) });
  if (!r.ok) return null; const j: any = await r.json();
  const g = j?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups; if (!Array.isArray(g)) return null;
  return g[0]?.sum?.visits ?? 0;
}
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const cache = (caches as any).default as Cache; const key = new Request(new URL('/api/visitors?v=1', ctx.request.url).toString());
  const hit = await cache.match(key); if (hit) return hit;
  let total: number | null = null, source = 'cloudflare-web-analytics';
  try { if (ctx.env.CF_ANALYTICS_TOKEN) total = await rum(ctx.env.CF_ANALYTICS_TOKEN); } catch {}
  if (total == null && ctx.env.DB) { source = 'd1-daily-unique';
    try { const r = await ctx.env.DB.prepare("SELECT COUNT(DISTINCT substr(ts,1,10)||ip_hash) AS v FROM events WHERE kind='view' AND ip_hash IS NOT NULL").first<{ v: number }>(); total = r?.v ?? 0; } catch {} }
  const res = new Response(JSON.stringify({ total, source }), { status: total == null ? 503 : 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } });
  if (total != null) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
};
