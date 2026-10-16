// First-party interaction events -> private D1 table `events`. No cookies, no raw IP stored.
interface Env { DB?: D1Database; IP_SALT?: string }
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|python|curl|wget|httpclient|axios|node-fetch|undici|go-http|java\/|scrapy|lighthouse|pingdom|uptime|monitor|gptbot|chatgpt|claude|perplexity|bytespider|semrush|ahrefs|toolhype-scan/i;
const KINDS = new Set(['view', 'click', 'submit', 'search']);
const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n) : '') || null;
async function hash(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const ok = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const req = ctx.request;
  const ua = req.headers.get('user-agent') || '';
  if (!ua || ua === 'node' || BOT.test(ua) || (req as any).cf?.botManagement?.verifiedBot === true || !ctx.env.DB) return ok();
  const origin = req.headers.get('origin');
  if (origin && !/^https:\/\/([a-z0-9-]+\.)?toolhype\.(dev|pages\.dev)$/.test(origin)) return ok();
  const raw = await req.text();
  if (raw.length > 1024) return ok();
  let j: any; try { j = JSON.parse(raw); } catch { return ok(); }
  const kind = String(j?.k || ''); if (!KINDS.has(kind)) return ok();
  const page = clean(j.p, 200); if (!page || !page.startsWith('/')) return ok();
  const el = clean(j.e, 80), label = clean(j.l, 80);
  const uaClass = /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop';
  const ip = req.headers.get('cf-connecting-ip') || '';
  ctx.waitUntil((async () => {
    try {
      const day = new Date().toISOString().slice(0, 10);
      const ipHash = ip ? await hash(`${ctx.env.IP_SALT || ''}|ev|${day}|${ip}`) : null;
      if (ipHash) { // at most 60 events per IP-hash per 10 min
        const c = await ctx.env.DB!.prepare("SELECT COUNT(*) AS n FROM events WHERE ip_hash = ? AND ts > strftime('%Y-%m-%dT%H:%M:%SZ','now','-10 minutes')").bind(ipHash).first<{ n: number }>();
        if ((c?.n ?? 0) >= 60) return;
      }
      await ctx.env.DB!.prepare('INSERT INTO events (kind, page, element, label, country, ua_class, ip_hash) VALUES (?,?,?,?,?,?,?)')
        .bind(kind, page, el, label, (req as any).cf?.country || null, uaClass, ipHash).run();
    } catch (e) { console.error('event log failed', e); }
  })());
  return ok();
};
