import pj from '../data/prompts.json';
export interface Prompt { title: string; category: string; tool: string; prompt: string; why: string; source: string; author: string; note?: string; likes: number; likesAsOf: string; promptSource?: string }
export interface Issue { n: number; slug: string; title: string; date: string; intro: string; rule?: string; prompts: Prompt[] }
export const getIssues = (): Issue[] => [...(pj as any).issues].sort((a, b) => b.n - a.n);
export const issueLd = (i: Issue, url: string) => ({
  '@context': 'https://schema.org', '@type': 'Article', headline: i.title, datePublished: i.date, dateModified: i.date, url,
  description: i.intro, author: { '@type': 'Organization', name: 'toolhype', url: 'https://toolhype.dev' },
  publisher: { '@type': 'Organization', name: 'toolhype' }, isPartOf: { '@type': 'CreativeWorkSeries', name: 'Prompt Drop' },
  hasPart: i.prompts.map((p, k) => ({ '@type': 'HowTo', position: k + 1, name: p.title, description: p.why, tool: { '@type': 'HowToTool', name: p.tool },
    step: [{ '@type': 'HowToStep', text: `Copy this prompt into ${p.tool} and replace the [brackets]: ${p.prompt}` }], citation: p.source })),
});
