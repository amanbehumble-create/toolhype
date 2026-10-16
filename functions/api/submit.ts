// Tool submissions -> private D1 table `submissions`. No raw IP stored (daily-salted hash for rate limits only).
interface Env { DB?: D1Database; IP_SALT?: string }
const J = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim() : '').slice(0, n);
async function hash(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const req = ctx.request;
  if (!ctx.env.DB) return J(503, { error: 'Submissions are temporarily unavailable.' });
  const origin = req.headers.get('origin');
  if (!origin || !/^https:\/\/([a-z0-9-]+\.)?toolhype\.(dev|pages\.dev)$/.test(origin)) return J(403, { error: 'Bad origin.' });
  const raw = await req.text();
  if (raw.length > 4096) return J(413, { error: 'Too long.' });
  let j: any; try { j = JSON.parse(raw); } catch { return J(400, { error: 'Bad request.' }); }
  if (j?.website) return J(200, { ok: true }); // honeypot: pretend success
  const name = clean(j.name, 80), pitch = clean(j.pitch, 600) || null;
  let url = clean(j.url, 300);
  const email = clean(j.email, 120).toLowerCase() || null;
  const x = clean(j.x, 40).replace(/^@/, '').replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '').replace(/[/?].*$/, '') || null;
  if (name.length < 2) return J(400, { error: 'Please add the tool name.' });
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
  try { const u = new URL(url); if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || /^(localhost|\d+\.\d+\.\d+\.\d+)$/.test(u.hostname)) throw 0; url = u.toString(); }
  catch { return J(400, { error: 'Please enter a valid URL, like https://yourtool.com' }); }
  if (!email && !x) return J(400, { error: 'Please leave an email or X handle so we can reach you.' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return J(400, { error: 'That email doesn’t look right.' });
  if (x && !/^[A-Za-z0-9_]{1,15}$/.test(x)) return J(400, { error: 'That X handle doesn’t look right.' });
  const ip = req.headers.get('cf-connecting-ip') || '';
  const ipHash = ip ? await hash(`${ctx.env.IP_SALT || ''}|sub|${new Date().toISOString().slice(0, 10)}|${ip}`) : null;
  try {
    if (ipHash) {
      const c = await ctx.env.DB.prepare("SELECT COUNT(*) AS n FROM submissions WHERE ip_hash = ? AND ts > strftime('%Y-%m-%dT%H:%M:%SZ','now','-1 hour')").bind(ipHash).first<{ n: number }>();
      if ((c?.n ?? 0) >= 5) return J(429, { error: 'Too many submissions. Please try again in an hour.' });
    }
    await ctx.env.DB.prepare('INSERT INTO submissions (name, url, pitch, email, x_handle, country, ip_hash) VALUES (?,?,?,?,?,?,?)')
      .bind(name, url, pitch, email, x, (req as any).cf?.country || null, ipHash).run();
  } catch (e) { console.error('submission failed', e); return J(500, { error: 'Something went wrong. Please try again.' }); }
  return J(200, { ok: true });
};
