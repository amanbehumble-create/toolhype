// Daily creator drip. Unreleased creators live only in D1 `creator_drip`; this injects the ones whose
// release_date (HKT) has arrived into the static /creators list pages, serves their avatars, and renders
// /creators/<handle> pages for released drip creators (404 before release, never for parked rows).
import { type Env, TOTAL, ESSENTIALS, todayHKT, nextUnlockMs, releasedBadges } from '../_lib/drip';
import { badgeHtml, creatorsItemListLd, profilePageLd, creatorTitle, creatorDesc, whyFollow, displayName, esc } from '../../src/lib/badge';
const json = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c');
const notFound = async (ctx: EventContext<Env, string, unknown>) => {
  const r = await ctx.env.ASSETS.fetch(new URL('/404', ctx.request.url));
  return new Response(r.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate' } });
};
const fresh = (res: Response, status = res.status) => { const h = new Headers(res.headers); h.set('Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate'); return new Response(res.body, { status, headers: h }); };

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/\/$/, '').replace(/\.html$/, '');
  const av = path.match(/^\/creators\/av\/([A-Za-z0-9_]{1,15})\.webp$/);
  if (av) {
    if (!ctx.env.DB) return new Response('Not found', { status: 404 });
    const r = await ctx.env.DB.prepare('SELECT avatar_b64 FROM creator_drip WHERE handle = ? AND release_date <= ?').bind(av[1], todayHKT()).first<{ avatar_b64: string }>();
    if (!r?.avatar_b64) return new Response('Not found', { status: 404 });
    const bin = Uint8Array.from(atob(r.avatar_b64), (c) => c.charCodeAt(0));
    return new Response(bin, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400' } });
  }
  if (path === '/creators/drip-template') return notFound(ctx);
  const isList = path === '/creators' || /^\/creators\/starter-pack-\d+$/.test(path);
  const one = !isList ? path.match(/^\/creators\/([A-Za-z0-9_]{1,15})$/) : null;
  const res = await ctx.next();
  if (one && res.status === 404) {
    const all = await releasedBadges(ctx.env);
    const c = all.find((x) => x.handle.toLowerCase() === one[1].toLowerCase());
    if (!c) return notFound(ctx);
    if (c.handle !== one[1]) return Response.redirect(new URL(`/creators/${c.handle}`, url).toString(), 301);
    const tpl = await (await ctx.env.ASSETS.fetch(new URL('/creators/drip-template', url))).text();
    const name = displayName(c);
    const ld = [profilePageLd(c), { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', '/'], ['X Creators', '/creators'], ['Starter Pack #1', '/creators/starter-pack-1'], [name, `/creators/${c.handle}`]].map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: 'https://toolhype.dev' + p })) }];
    const title = creatorTitle(c), desc = creatorDesc(c).length > 160 ? creatorDesc(c).slice(0, 157).replace(/\s+\S*$/, '') + '…' : creatorDesc(c);
    const html = tpl
      .replace(/<meta name="robots" content="noindex"\s*\/?>/, '')
      .replaceAll('/creators/drip-template', `/creators/${c.handle}`)
      .replaceAll('__CR_TITLE__', esc(title)).replaceAll('__CR_DESC__', esc(desc)).replaceAll('__CR_HANDLE__', esc(c.handle))
      .replace(/<div data-cr-badge><\/div>/, badgeHtml(c, 'full'))
      .replace(/<p class="answer" data-cr-answer><\/p>/, `<p class="answer"><b>${esc(name)}</b> (@${esc(c.handle)}) ${esc(whyFollow(c).replace(/^Why follow: /, 'is '))}</p>`)
      .replace('</head>', `<script type="application/ld+json">${json(ld[0])}</script><script type="application/ld+json">${json(ld[1])}</script></head>`);
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate' } });
  }
  if (!isList || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  const rel = await releasedBadges(ctx.env), today = todayHKT();
  const revealed = ESSENTIALS + rel.length, next = nextUnlockMs();
  const list = [...rel].reverse().map((c) => badgeHtml(c, 'mini', { isNew: c.unlocked === today })).join('');
  const ld = rel.length ? json(creatorsItemListLd('Daily creator drops', rel)) : '';
  const out = new HTMLRewriter()
    .on('[data-drip-revealed]', { element(e) { e.setInnerContent(String(revealed)); } })
    .on('[data-drip-left]', { element(e) { e.setInnerContent(String(TOTAL - revealed)); } })
    .on('[data-drip-next]', { element(e) { e.setAttribute('data-drip-next', String(next)); } })
    .on('[data-drip-list]', { element(e) { if (list) e.prepend(list, { html: true }); } })
    .on('[data-drip-empty]', { element(e) { if (list) e.remove(); } })
    .on('[data-drip-done]', { element(e) { if (revealed < TOTAL) e.remove(); } })
    .on('[data-drip-locked]', { element(e) { if (revealed >= TOTAL) e.remove(); } })
    .on('head', { element(e) { if (ld) e.append(`<script type="application/ld+json">${ld}</script>`, { html: true }); } })
    .transform(res);
  return fresh(out);
};
