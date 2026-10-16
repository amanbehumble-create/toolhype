import { getTools } from './data';
export const shortName = (n: string) => {
  const p = n.match(/\(([^)]+)\)/); if (p) n = p[1];
  const w = n.split(' '); while (w.length > 1 && w.join(' ').length > 18) w.pop();
  return w.join(' ').replace(/[&·-]$/, '').trim();
};
export const topTools = (k = 5) => [...getTools()].filter((t) => t.buzz.score != null)
  .sort((a, b) => (b.buzz.score ?? 0) - (a.buzz.score ?? 0)).slice(0, k)
  .map((t) => ({ slug: t.slug, name: shortName(t.name), score: t.buzz.score }));
