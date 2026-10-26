// "Get more useful X resources" email sign-ups -> private D1 table `resource_signups`.
// Synced to the Notion "X Resources Waitlist" database by the toolhype submissions-check routine. No raw IP stored.
interface Env { DB?: D1Database; IP_SALT?: string }
const J = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
async function hash(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const req = ctx.request;
  if (!ctx.env.DB) return J(503, { error: 'Sign-ups are temporarily unavailable.' });
  const origin = req.headers.get('origin');
  if (!origin || !/^https:\/\/([a-z0-9-]+\.)?toolhype\.(dev|pages\.dev)$/.test(origin) && !/^https:\/\/[a-z0-9-]+\.toolhype-dqp\.pages\.dev$/.test(origin)) return J(403, { error: 'Bad origin.' });
  const raw = await req.text();
  if (raw.length > 1024) return J(413, { error: 'Too long.' });
  let j: any; try { j = JSON.parse(raw); } catch { return J(400, { error: 'Bad request.' }); }
  if (j?.website) return J(200, { ok: true }); // honeypot
  const email = (typeof j.email === 'string' ? j.email : '').trim().toLowerCase().slice(0, 120);
  const source = (typeof j.source === 'string' ? j.source : '').replace(/[^a-z0-9/_-]/gi, '').slice(0, 60) || 'creators';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return J(400, { error: 'That email doesn’t look right.' });
  const ip = req.headers.get('cf-connecting-ip') || '';
  const ipHash = ip ? await hash(`${ctx.env.IP_SALT || ''}|rs|${new Date().toISOString().slice(0, 10)}|${ip}`) : null;
  try {
    if (ipHash) {
      const c = await ctx.env.DB.prepare("SELECT COUNT(*) AS n FROM resource_signups WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ','now','-1 hour')").bind(ipHash).first<{ n: number }>();
      if ((c?.n ?? 0) >= 5) return J(429, { error: 'Too many sign-ups from here. Please try again in an hour.' });
    }
    await ctx.env.DB.prepare('INSERT INTO resource_signups (email, source, ip_hash) VALUES (?,?,?) ON CONFLICT(email) DO NOTHING').bind(email, source, ipHash).run();
  } catch (e) { console.error('signup failed', e); return J(500, { error: 'Something went wrong. Please try again.' }); }
  return J(200, { ok: true });
};
