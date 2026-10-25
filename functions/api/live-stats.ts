// Public, aggregate-only live stats for the homepage "live" section. Country-level only; never returns IPs, hashes or UAs.
// Sources: Cloudflare GraphQL Analytics (zone uniques/requests/countries, needs CF_API_TOKEN + CF_ZONE_ID secrets)
// and D1 (first-party bot-filtered page views in `events`, AI crawler counts in `ai_hits`). Cached 10 min at the edge.
interface Env { DB?: D1Database; CF_API_TOKEN?: string; CF_ZONE_ID?: string }
const TTL = 600;
const H = { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${TTL}, s-maxage=${TTL}` };
const day = (d: number) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);

async function cfZone(env: Env) {
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) return { ok: false, reason: 'not_configured' };
  const query = `query($z:String!,$s:Date!){viewer{zones(filter:{zoneTag:$z}){total:httpRequests1dGroups(limit:1,filter:{date_geq:$s}){uniq{uniques}} httpRequests1dGroups(limit:8,filter:{date_geq:$s},orderBy:[date_ASC]){dimensions{date} sum{requests countryMap{clientCountryName requests}} uniq{uniques}}}}}`;
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { z: env.CF_ZONE_ID, s: day(6) } }),
  });
  const j: any = await r.json().catch(() => null);
  const g = j?.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
  if (!r.ok || !Array.isArray(g)) return { ok: false, reason: 'cf_error' };
  const byC: Record<string, number> = {}; let uniques = 0, requests = 0;
  for (const d of g) { uniques += d.uniq?.uniques || 0; requests += d.sum?.requests || 0;
    for (const c of d.sum?.countryMap || []) if (c.clientCountryName && c.clientCountryName !== 'XX' && c.clientCountryName !== 'T1') byC[c.clientCountryName] = (byC[c.clientCountryName] || 0) + c.requests; }
  // True 7-day unique (one window, no date dimension), not a sum of daily uniques.
  const tu = j?.data?.viewer?.zones?.[0]?.total?.[0]?.uniq?.uniques; if (typeof tu === 'number') uniques = tu;
  const countries = Object.entries(byC).sort((a, b) => b[1] - a[1]).map(([cc, n]) => ({ cc, n }));
  return { ok: true, uniques, requests, days: g.length, since: g[0]?.dimensions?.date || null, countries };
}

async function d1(env: Env) {
  if (!env.DB) return null;
  const db = env.DB;
  const [active, views, feed, ai, aiSince] = await Promise.all([
    db.prepare("SELECT COUNT(DISTINCT ip_hash) n, COUNT(DISTINCT country) c FROM events WHERE ts > strftime('%Y-%m-%dT%H:%M:%SZ','now','-30 minutes') AND ip_hash IS NOT NULL").first<any>(),
    db.prepare("SELECT country cc, COUNT(*) n FROM events WHERE kind='view' AND country IS NOT NULL AND ts > strftime('%Y-%m-%dT%H:%M:%SZ','now','-7 days') GROUP BY country ORDER BY n DESC").all<any>(),
    db.prepare("SELECT ts, kind, page, country cc FROM events WHERE country IS NOT NULL AND kind IN ('view','click','search') ORDER BY id DESC LIMIT 6").all<any>(),
    db.prepare("SELECT bot, SUM(n) n FROM ai_hits WHERE day >= ? GROUP BY bot ORDER BY n DESC").bind(day(6)).all<any>().catch(() => null),
    db.prepare("SELECT MIN(day) d FROM ai_hits").first<any>().catch(() => null),
  ]);
  const safePage = (p: string) => (/^\/(tools|vs|best|c|prompts|hype)\/[a-z0-9-]{1,60}\/?$|^\/[a-z0-9-]{0,30}\/?$/.test(p || '') ? p : '/');
  return {
    active30m: active?.n ?? null, activeCountries: active?.c ?? null,
    views7d: (views?.results || []).map((r: any) => ({ cc: r.cc, n: r.n })),
    feed: (feed?.results || []).map((r: any) => ({ ts: r.ts, kind: r.kind, page: r.kind === 'search' ? null : safePage(r.page), cc: r.cc })),
    ai: ai ? (ai.results || []).map((r: any) => ({ bot: r.bot, n: r.n })) : null,
    aiSince: aiSince?.d ?? null,
  };
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const cache = (caches as any).default as Cache;
  const key = new Request(new URL('/api/live-stats', ctx.request.url).toString());
  const hit = await cache.match(key); if (hit) return hit;
  const [zone, local] = await Promise.all([cfZone(ctx.env).catch(() => ({ ok: false, reason: 'cf_error' })), d1(ctx.env).catch(() => null)]);
  const body = { generated: new Date().toISOString(), cloudflare: zone, site: local };
  const res = new Response(JSON.stringify(body), { headers: H });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
};
