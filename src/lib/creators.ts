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
