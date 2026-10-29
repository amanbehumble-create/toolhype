import type { Tool } from './data';
const base = () => import.meta.env.SITE || 'https://toolhype.dev';
export const toolUrl = (t: Tool) => `${base()}/tools/${t.slug}`;
export const appLd = (t: Tool) => ({
  '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: t.name, url: t.url, sameAs: t.url,
  mainEntityOfPage: toolUrl(t), applicationCategory: t.category, description: t.verdict, operatingSystem: 'Web',
  ...(t.logo ? { image: base() + t.logo } : {}), datePublished: t.addedAt,
  ...(['free', 'freemium', 'open-source'].includes(t.pricing) ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', category: t.pricing } } : {}),
});
export const listLd = (name: string, tools: Tool[]) => ({
  '@context': 'https://schema.org', '@type': 'ItemList', name, numberOfItems: tools.length,
  itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: toolUrl(t) })),
});
export const faqLd = (qa: [string, string][]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
export const crumbsLd = (items: [string, string][]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: base() + p })),
});
