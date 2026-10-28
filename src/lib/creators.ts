import data from '../data/creators.json';
import { getTools } from './data';
export type Creator = (typeof data.packs)[number]['accounts'][number];
export const getPacks = () => data.packs;
export const getPack = (slug: string) => data.packs.find((p) => p.slug === slug);
export const fmtK = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n));
export const toolName = (slug: string) => getTools().find((t) => t.slug === slug)?.name ?? slug;
export const creatorsListLd = (name: string, list: Creator[]) => ({
  '@context': 'https://schema.org', '@type': 'ItemList', name, numberOfItems: list.length,
  itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Person', name: c.name, alternateName: '@' + c.handle, url: `https://x.com/${c.handle}`, description: c.descriptor } })),
});
// Daily drip: non-Essentials creators live in D1 `creator_drip` (not in the repo or static build) and are
// revealed one per day at 00:00 HKT by functions/creators/[[path]].ts. Static HTML only has Essentials.
export const DRIP_TOTAL = 98;
import { ESSENTIALS_LIVE, type BadgeCreator } from './badge';
// Only Essentials are ever turned into static pages / sitemap / llms entries. Drip creators come from D1 at runtime.
export const essentials = () => data.packs[0].accounts.filter((c) => c.section === 'essentials');
export const essentialBadges = (): BadgeCreator[] => essentials().map((c) => ({ handle: c.handle, name: c.name, followers: c.followers, section: c.section, descriptor: c.descriptor, avatar: c.avatar, drop: c.no, unlocked: ESSENTIALS_LIVE, tools: c.tools.map((t) => ({ slug: t, name: toolName(t) })) }));
