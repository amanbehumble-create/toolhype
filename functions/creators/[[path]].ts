// Daily creator drip. Unreleased creators live only in D1 `creator_drip`; this injects the ones whose
// release_date (HKT) has arrived into the static /creators pages, and serves their avatars.
interface Env { DB?: D1Database }
type Row = { seq: number; release_date: string; handle: string; name: string; followers: number; section: string; descriptor: string; tools: string };
const TOTAL = 98, ESSENTIALS = 16;
const HKT = 8 * 3600e3;
const todayHKT = (now = Date.now()) => new Date(now + HKT).toISOString().slice(0, 10);
const nextUnlockMs = (now = Date.now()) => { const d = new Date(now + HKT); d.setUTCHours(24, 0, 0, 0); return d.getTime() - HKT; };
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const fmtK = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n));
const SECTION: Record<string, string> = { 'strong-follows': 'Strong follows', 'further-picks': 'Further picks', 'article-writers': 'Article writers' };

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const av = url.pathname.match(/^\/creators\/av\/([A-Za-z0-9_]{1,15})\.webp$/);
  if (av) {
    if (!ctx.env.DB) return new Response('Not found', { status: 404 });
    const r = await ctx.env.DB.prepare('SELECT avatar_b64 FROM creator_drip WHERE handle = ? AND release_date <= ?').bind(av[1], todayHKT()).first<{ avatar_b64: string }>();
    if (!r?.avatar_b64) return new Response('Not found', { status: 404 });
    const bin = Uint8Array.from(atob(r.avatar_b64), (c) => c.charCodeAt(0));
    return new Response(bin, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400' } });
  }
  const res = await ctx.next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
  let rows: Row[] = [];
  try { if (ctx.env.DB) rows = (await ctx.env.DB.prepare("SELECT seq, release_date, handle, name, followers, section, descriptor, tools FROM creator_drip WHERE pack = 'starter-pack-1' AND release_date <= ? ORDER BY seq DESC").bind(todayHKT()).all<Row>()).results ?? []; } catch {}
  const revealed = ESSENTIALS + rows.length, next = nextUnlockMs();
  const list = rows.map((c) => {
    let tools: string[] = []; try { tools = JSON.parse(c.tools || '[]'); } catch {}
    const isNew = c.release_date === todayHKT();
    return `<li class="w98-item" id="${esc(c.handle)}"><img src="/creators/av/${esc(c.handle)}.webp" alt="${esc(c.name)} on X" width="48" height="48" loading="lazy"/><div><b><a href="https://x.com/${esc(c.handle)}" rel="noopener" target="_blank">${esc(c.name)}</a>${isNew ? ' <span class="w98-new">NEW TODAY</span>' : ''}</b><small>@${esc(c.handle)} · ${fmtK(c.followers)} followers · ${esc(SECTION[c.section] || '')}</small><p>${esc(c.descriptor)}</p>${tools.length ? `<p>On toolhype: ${tools.map((t) => `<a href="/tools/${esc(t)}">${esc(t)}</a>`).join(', ')}</p>` : ''}<small>Unlocked ${esc(c.release_date)}</small></div></li>`;
  }).join('');
  const ld = rows.length ? JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Daily creator drops', numberOfItems: rows.length, itemListElement: rows.map((c, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Person', name: c.name, alternateName: '@' + c.handle, url: `https://x.com/${c.handle}`, description: c.descriptor } })) }).replace(/</g, '\\u003c') : '';
  const out = new HTMLRewriter()
    .on('[data-drip-revealed]', { element(e) { e.setInnerContent(String(revealed)); } })
    .on('[data-drip-left]', { element(e) { e.setInnerContent(String(TOTAL - revealed)); } })
    .on('[data-drip-next]', { element(e) { e.setAttribute('data-drip-next', String(next)); } })
    .on('[data-drip-list]', { element(e) { if (list) e.setInnerContent(list, { html: true }); } })
    .on('[data-drip-empty]', { element(e) { if (list) e.remove(); } })
    .on('[data-drip-done]', { element(e) { if (revealed < TOTAL) e.remove(); } })
    .on('[data-drip-locked]', { element(e) { if (revealed >= TOTAL) e.remove(); } })
    .on('head', { element(e) { if (ld) e.append(`<script type="application/ld+json">${ld}</script>`, { html: true }); } })
    .transform(res);
  const h = new Headers(out.headers); h.set('Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate');
  return new Response(out.body, { status: out.status, headers: h });
};
