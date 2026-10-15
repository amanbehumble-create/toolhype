// Data adapter. v1 reads seed JSON at build time. Swap these functions for Supabase queries later.
import toolsJson from '../data/tools.json';
import commJson from '../data/communities.json';
import buzzJson from '../data/buzz.json';

export interface BuzzPost { id: string; url: string; author: string | null; text: string; created_at: string; likes: number; reposts: number; replies: number; quotes: number; views?: number | null }
export interface Buzz {
  score: number | null; status: 'pending' | 'live'; mentions7d: number | null; updatedAt: string | null;
  mentions24h?: number; priorDailyAvg?: number; velocity?: number; daily?: number[]; label?: 'hype' | 'rising' | 'steady' | 'quiet';
  viral?: boolean; query?: string; parts?: { volume: number; velocity: number; engagement: number };
  sample?: { posts: number; likes: number; reposts: number; replies: number }; topPosts?: BuzzPost[];
}
export interface Tool {
  slug: string; name: string; url: string; affiliateUrl: string | null; category: string; useCases: string[];
  pricing: string; verdict: string; useThisIf: string; alternatives: string[]; source: string; addedAt: string;
  featured: boolean; buzz: Buzz; logo?: string | null;
}
export interface Community { slug: string; name: string; description: string }

const B = (buzzJson as any).tools as Record<string, any>;
export const BUZZ_AT: string = (buzzJson as any).computedAt;
const withBuzz = (t: Tool): Tool => {
  const b = B[t.slug];
  if (!b || b.status !== 'live') return { ...t, buzz: { ...t.buzz, score: null, status: 'pending' } };
  return { ...t, buzz: { ...b, status: 'live', score: b.score, mentions7d: b.mentions7d, updatedAt: b.computedAt } };
};
const ALL = (toolsJson as Tool[]).map(withBuzz);
export const getTools = (): Tool[] => ALL;
export const byBuzz = (a: Tool, b: Tool) => (b.buzz.score ?? -1) - (a.buzz.score ?? -1);
export const trendingOnX = (n = 5) => [...ALL].filter((t) => t.buzz.status === 'live').sort(byBuzz).slice(0, n);
export const hkt = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Hong_Kong', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) + ' HKT';
export const LABEL: Record<string, string> = { hype: 'Hype', rising: '↗ Rising', steady: 'Steady', quiet: 'Quiet' };
export const getTool = (slug: string) => getTools().find((t) => t.slug === slug);
export const getCommunities = (): Community[] => commJson as Community[];
export const getCommunity = (slug: string) => getCommunities().find((c) => c.slug === slug);
export const toolsIn = (c: string) => getTools().filter((t) => t.useCases.includes(c));
export const newThisWeek = (now = new Date()) =>
  getTools().filter((t) => now.getTime() - new Date(t.addedAt).getTime() <= 7 * 864e5).sort(byNew);
export const byNew = (a: Tool, b: Tool) => b.addedAt.localeCompare(a.addedAt);
export const outUrl = (t: Tool) => t.affiliateUrl || t.url;

// Hot = upvotes (log) + X Buzz Score + recency boost that fades over ~3 days. Same formula runs client-side in Feed.astro.
export function hot(votes: number, buzz: number | null, addedAt: string, now = Date.now()) {
  const ageH = Math.max(0, (now - new Date(addedAt).getTime()) / 36e5);
  return Math.log10(Math.max(votes, 1)) * 2 + (buzz ?? 0) / 20 + 3 * Math.exp(-ageH / 72);
}
export const SITE = { name: 'toolhype', tagline: 'AI tools + software, ranked by builders and buzz on X' };
