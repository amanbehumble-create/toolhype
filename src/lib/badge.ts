// Y2K "creator pass" ID badge markup. Pure string functions so both the static Astro build (Essentials)
// and the Pages Function (daily drip creators, from D1) render identical badges.
export type BadgeCreator = { handle: string; name: string; followers?: number | null; section: string; descriptor: string; avatar: string; drop: number; unlocked: string; tools?: { slug: string; name: string }[] };
export const SITE_URL = 'https://toolhype.dev';
export const SECTION_TITLE: Record<string, string> = { essentials: 'Essentials', 'strong-follows': 'Strong follows', 'further-picks': 'Further picks', 'article-writers': 'Article writers' };
export const ESSENTIALS_LIVE = '2026-10-28';
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export const fmtFollowers = (n?: number | null) => (!n ? '' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n));
export const displayName = (c: { name: string; handle: string }) => (c.name.replace(/^@/, '').trim() || c.handle);
export const creatorUrl = (handle: string) => `${SITE_URL}/creators/${handle}`;
const hash = (s: string) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed: number) => () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9 >>> 0) / 4294967296);

// Decorative barcode (not machine-readable data), deterministic per handle.
export const barcodeSvg = (handle: string) => {
  const r = rng(hash(handle)); let x = 0, bars = '';
  while (x < 116) { const w = 1 + Math.floor(r() * 3); if (r() > 0.4) bars += `<rect x="${x}" width="${w}" height="26"/>`; x += w + 1; }
  return `<svg class="bdg-bar" viewBox="0 0 118 26" aria-hidden="true" focusable="false" preserveAspectRatio="none">${bars}</svg>`;
};
// Decorative QR-style mark with real finder patterns; deterministic per handle (the badge links the URL in text).
export const qrSvg = (handle: string) => {
  const r = rng(hash('qr:' + handle)), N = 21; let cells = '';
  const finder = (x: number, y: number) => x < 8 && y < 8 || x > N - 9 && y < 8 || x < 8 && y > N - 9;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && r() > 0.52) cells += `M${x} ${y}h1v1h-1z`;
  const f = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  return `<svg class="bdg-qr" viewBox="-1 -1 23 23" aria-hidden="true" focusable="false"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/><path fill-rule="evenodd" d="${f(0, 0)}${f(N - 7, 0)}${f(0, N - 7)}${cells}"/></svg>`;
};
const idCode = (c: BadgeCreator) => `TH-SP1-${String(c.drop).padStart(3, '0')}`;

/** mode 'full' = the big badge on /creators/<handle> (h1 name); 'mini' = grid card linking to that page. */
export const badgeHtml = (c: BadgeCreator, mode: 'full' | 'mini' = 'mini', opts: { isNew?: boolean } = {}) => {
  const name = esc(displayName(c)), h = esc(c.handle), sec = esc(SECTION_TITLE[c.section] || c.section);
  const fol = fmtFollowers(c.followers);
  const fields = `<dl class="bdg-fields"><div><dt>Creator</dt><dd>${name}</dd></div><div><dt>Handle</dt><dd>@${h}</dd></div><div><dt>Section</dt><dd>${sec}</dd></div><div><dt>Drop #</dt><dd>${String(c.drop).padStart(2, '0')}/98</dd></div><div><dt>Unlocked</dt><dd><time datetime="${esc(c.unlocked)}">${esc(c.unlocked)}</time></dd></div>${fol ? `<div><dt>Followers</dt><dd>${fol}</dd></div>` : ''}</dl>`;
  const top = `<div class="bdg-top"><span class="bdg-kind">🪪 CreatorPass_${h}.exe</span><span class="bdg-btns" aria-hidden="true"><i>_</i><i>×</i></span></div>`;
  const photo = `<div class="bdg-photo"><img src="${esc(c.avatar)}" alt="${mode === 'full' ? `${name} (@${h}) profile photo` : ''}" width="${mode === 'full' ? 160 : 72}" height="${mode === 'full' ? 160 : 72}" loading="${mode === 'full' ? 'eager' : 'lazy'}" decoding="async"/></div>`;
  const strip = `<div class="bdg-strip">${barcodeSvg(c.handle)}<span class="bdg-id">${idCode(c)}</span>${mode === 'full' ? qrSvg(c.handle) : ''}</div>`;
  if (mode === 'mini') return `<li class="bdg-cell" id="${h}"><a class="bdg bdg-mini" href="/creators/${h}" aria-label="${name}, @${h}: creator pass"><span class="bdg-hole" aria-hidden="true"></span>${top}<span class="bdg-org" aria-hidden="true">tool<b>hype</b> · X CREATOR PASS</span>${photo}<span class="bdg-name">${name}${opts.isNew ? ' <span class="bdg-new">NEW TODAY</span>' : ''}</span><span class="bdg-handle">@${h} · ${sec}</span><span class="bdg-why">${esc(c.descriptor)}</span>${strip}</a></li>`;
  const tools = c.tools?.length ? `<p class="bdg-tools">On toolhype: ${c.tools.map((t) => `<a href="/tools/${esc(t.slug)}">${esc(t.name)}</a>`).join(', ')}</p>` : '';
  return `<div class="bdg-hang"><div class="bdg-lanyard" aria-hidden="true"><span class="bdg-strap"><i>toolhype · toolhype · toolhype</i></span><span class="bdg-clip"></span></div>
<article class="bdg bdg-full" aria-labelledby="bdg-name"><span class="bdg-hole" aria-hidden="true"></span>${top}<span class="bdg-org" aria-hidden="true">tool<b>hype</b> · X CREATOR PASS</span>${photo}<h1 class="bdg-name" id="bdg-name">${name}</h1><p class="bdg-handle"><a href="https://x.com/${h}" rel="noopener" target="_blank">@${h}</a></p>${fields}<p class="bdg-why">${esc(c.descriptor)}</p>${tools}${strip}</article></div>`;
};

/** "CLASSIFIED" teaser for the next locked drop. No creator data is ever placed in it. */
export const classifiedHtml = (attrs = '') => `<li class="bdg-cell" ${attrs}><div class="bdg bdg-mini bdg-classified" aria-label="Locked creator pass"><span class="bdg-hole" aria-hidden="true"></span><div class="bdg-top"><span class="bdg-kind">🔒 Classified.exe</span><span class="bdg-btns" aria-hidden="true"><i>_</i><i>×</i></span></div><div class="bdg-photo bdg-photo-x" aria-hidden="true">?</div><span class="bdg-stamp">CLASSIFIED</span><span class="bdg-handle">Next drop in <b class="drip-cd" data-drip-next="">soon</b></span><div class="bdg-strip">${barcodeSvg('classified')}<span class="bdg-id">TH-SP1-???</span></div></div></li>`;

export const personLd = (c: BadgeCreator) => ({ '@type': 'Person', name: displayName(c), alternateName: '@' + c.handle, description: c.descriptor, url: creatorUrl(c.handle), sameAs: [`https://x.com/${c.handle}`], image: SITE_URL + c.avatar });
export const creatorsItemListLd = (name: string, list: BadgeCreator[]) => ({ '@context': 'https://schema.org', '@type': 'ItemList', name, numberOfItems: list.length, itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: creatorUrl(c.handle), item: personLd(c) })) });
export const profilePageLd = (c: BadgeCreator) => ({ '@context': 'https://schema.org', '@type': 'ProfilePage', url: creatorUrl(c.handle), name: `${displayName(c)} (@${c.handle}) on X`, dateModified: c.unlocked, mainEntity: personLd(c), isPartOf: { '@type': 'CollectionPage', name: 'X creator starter packs', url: SITE_URL + '/creators' } });
export const creatorTitle = (c: BadgeCreator) => `${displayName(c)} (@${c.handle}): X creator worth following`;
export const creatorDesc = (c: BadgeCreator) => `${displayName(c)} (@${c.handle}) on X: ${c.descriptor.replace(/\.$/, '')}. A ${SECTION_TITLE[c.section] || ''} pick in toolhype's Starter Pack #1 of X creators.`;
export const whyFollow = (c: BadgeCreator) => `Why follow: hand-picked for the ${SECTION_TITLE[c.section] || c.section} section of Starter Pack #1${c.followers ? `, with ${fmtFollowers(c.followers)} followers (snapshot)` : ''}. ${c.descriptor.replace(/\.$/, '')}.`;
