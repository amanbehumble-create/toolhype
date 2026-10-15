import type { Tool } from './data';
const base = () => import.meta.env.SITE || 'https://toolhype.dev';
export const appLd = (t: Tool) => ({
  '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: t.name, url: t.url,
  applicationCategory: t.category, description: t.verdict, operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: t.pricing === 'paid' ? undefined : '0', category: t.pricing },
});
export const listLd = (name: string, tools: Tool[]) => ({
  '@context': 'https://schema.org', '@type': 'ItemList', name,
  itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: `${base()}/tools/${t.slug}` })),
});
