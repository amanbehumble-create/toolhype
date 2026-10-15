// Outbound click tracker: /go/<slug>?from=<page> -> official tool URL with ?ref=toolhype.dev.
// Only slugs in the build-time map redirect (no open redirect). Clicks go to private D1 (binding DB).
import MAP from './_map.json';

interface Env { DB?: D1Database; IP_SALT?: string }
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|python|curl|wget|httpclient|axios|node-fetch|go-http|java\/|scrapy|lighthouse|pingdom|uptime|monitor|gptbot|chatgpt|claude|perplexity|bytespider|semrush|ahrefs/i;

async function hash(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const slug = String(ctx.params.slug || '').toLowerCase();
  const base = (MAP as Record<string, string>)[slug];
  if (!base) return Response.redirect(new URL('/', ctx.request.url).toString(), 302);
  const dest = new URL(base);
  dest.searchParams.set('ref', 'toolhype.dev');
  const req = ctx.request; const url = new URL(req.url);
  const ua = req.headers.get('user-agent') || '';
  const isBot = !ua || BOT.test(ua) || (req as any).cf?.botManagement?.verifiedBot === true;
  if (!isBot && ctx.env.DB) {
    let refHost: string | null = null;
    try { refHost = new URL(req.headers.get('referer') || '').hostname || null; } catch {}
    const from = (url.searchParams.get('from') || '').slice(0, 200) || null;
    const ip = req.headers.get('cf-connecting-ip') || '';
    ctx.waitUntil((async () => {
      try {
        const day = new Date().toISOString().slice(0, 10); // daily-rotating salt: can't track a person across days
        const ipHash = ip ? await hash(`${ctx.env.IP_SALT || ''}|${day}|${ip}`) : null;
        // Per-IP limit: at most 10 logged clicks per IP-hash per 10 min; excess still redirects, just isn't logged.
        if (ipHash) {
          const c = await ctx.env.DB!.prepare("SELECT COUNT(*) AS n FROM clicks WHERE ip_hash = ? AND ts > strftime('%Y-%m-%dT%H:%M:%SZ','now','-10 minutes')").bind(ipHash).first<{ n: number }>();
          if ((c?.n ?? 0) >= 10) return;
        }
        await ctx.env.DB!.prepare('INSERT INTO clicks (tool_slug, dest_url, source_page, referrer_host, country, user_agent_class, ip_hash) VALUES (?,?,?,?,?,?,?)')
          .bind(slug, dest.toString(), from, refHost, (req as any).cf?.country || null, 'human', ipHash).run();
      } catch (e) { console.error('click log failed', e); }
    })());
  }
  return new Response(null, { status: 302, headers: { Location: dest.toString(), 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'unsafe-url' } });
};

// HEAD (link checkers, previews): same redirect, never logged.
export const onRequestHead: PagesFunction<Env> = async (ctx) => {
  const base = (MAP as Record<string, string>)[String(ctx.params.slug || '').toLowerCase()];
  if (!base) return Response.redirect(new URL('/', ctx.request.url).toString(), 302);
  const dest = new URL(base); dest.searchParams.set('ref', 'toolhype.dev');
  return new Response(null, { status: 302, headers: { Location: dest.toString(), 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
};
