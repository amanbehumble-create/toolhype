import { getTool, getTools, BUZZ_AT, byBuzz, velPhrase, type Tool } from './data';
import buzzJson from '../data/buzz.json';
// ISO-8601 week id, e.g. 2026-w42
export const isoWeek = (iso: string) => {
  const d = new Date(iso); const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(); const w = Math.ceil(((+t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-w${String(w).padStart(2, '0')}`;
};
export const weekRange = (id: string) => {
  const [y, w] = id.split('-w').map(Number); const jan4 = new Date(Date.UTC(y, 0, 4));
  const mon = new Date(jan4); mon.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  const sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
  const f = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${f(mon)} – ${f(sun)}`;
};
export interface HypeRow { slug: string; name: string; score: number; mentions7d: number; mentions24h: number; velocity: number; label: string; why: string; verdict: string }
export interface HypeWeek { week: string; computedAt: string; rows: HypeRow[] }
const why = (b: any) => { const p = b.topPosts?.[0]; return `${b.mentions7d.toLocaleString('en-US')} X posts in 7 days (${b.mentions24h} in the last 24h, ${velPhrase(b)})` + (p ? `; top post by @${p.author ?? 'x'} got ${p.likes.toLocaleString('en-US')} likes` : '') + '.'; };
export const currentHype = (): HypeWeek => {
  const B = (buzzJson as any).tools;
  const rows = getTools().filter((t) => t.buzz.status === 'live').sort(byBuzz).slice(0, 10).map((t) => {
    const b = B[t.slug]; return { slug: t.slug, name: t.name, score: b.score, mentions7d: b.mentions7d, mentions24h: b.mentions24h, velocity: b.velocity, label: b.label, why: why(b), verdict: t.verdict };
  });
  return { week: isoWeek(BUZZ_AT), computedAt: BUZZ_AT, rows };
};
// Archived weeks: frozen snapshots in src/data/hype/<week>.json (written by scripts/hype-snapshot.mjs). Current week always comes from live buzz data.
const snaps = Object.values(import.meta.glob('../data/hype/*.json', { eager: true, import: 'default' })) as HypeWeek[];
export const allWeeks = (): HypeWeek[] => { const cur = currentHype(); return [cur, ...snaps.filter((s) => s.week !== cur.week)].sort((a, b) => b.week.localeCompare(a.week)); };

export const PAIRS: [string, string][] = [
  ['chatgpt', 'claude'], ['claude', 'gemini'], ['perplexity', 'grok'], ['cursor', 'github-copilot'], ['cursor', 'windsurf'],
  ['claude-code', 'codex'], ['lovable', 'bolt'], ['n8n', 'zapier'], ['midjourney', 'ideogram'], ['canva', 'figma'],
  ['runway', 'kling-ai'], ['heygen', 'synthesia'],
  ['kimi', 'claude'], ['chatgpt', 'grok'], ['claude-code', 'opencode'], ['base44', 'lovable'], ['kling-ai', 'higgsfield'], ['capcut', 'descript'], ['suno', 'elevenlabs'],
];
export const vsSlug = (a: string, b: string) => `${a}-vs-${b}`;
export const getPairs = () => PAIRS.map(([a, b]) => ({ slug: vsSlug(a, b), a: getTool(a)!, b: getTool(b)! })).filter((p) => p.a && p.b);
export const pairsFor = (slug: string) => getPairs().filter((p) => p.a.slug === slug || p.b.slug === slug);
export type Pair = { slug: string; a: Tool; b: Tool };
