// Data adapter. v1 reads seed JSON at build time. Swap these functions for Supabase queries later.
import toolsJson from '../data/tools.json';
import commJson from '../data/communities.json';

export interface Buzz { score: number | null; status: 'pending' | 'live'; mentions7d: number | null; updatedAt: string | null }
export interface Tool {
  slug: string; name: string; url: string; affiliateUrl: string | null; category: string; useCases: string[];
  pricing: string; verdict: string; useThisIf: string; alternatives: string[]; source: string; addedAt: string;
  featured: boolean; buzz: Buzz; logo?: string | null;
}
export interface Community { slug: string; name: string; description: string }

export const getTools = (): Tool[] => toolsJson as Tool[];
export const getTool = (slug: string) => getTools().find((t) => t.slug === slug);
export const getCommunities = (): Community[] => commJson as Community[];
export const getCommunity = (slug: string) => getCommunities().find((c) => c.slug === slug);
export const toolsIn = (c: string) => getTools().filter((t) => t.useCases.includes(c));
export const newThisWeek = (now = new Date()) =>
  getTools().filter((t) => now.getTime() - new Date(t.addedAt).getTime() <= 7 * 864e5).sort(byNew);
export const byNew = (a: Tool, b: Tool) => b.addedAt.localeCompare(a.addedAt);
export const outUrl = (t: Tool) => t.affiliateUrl || t.url;

// Hot score per design brief; votes come from client at runtime, so build-time order uses buzz + recency.
export function hot(votes: number, buzz: number | null, addedAt: string) {
  const v = Math.log10(Math.max(Math.abs(votes), 1));
  const x = Math.log10(1 + (buzz ?? 0)) * 0.6;
  return v + x + (new Date(addedAt).getTime() / 1000 - 1.7e9) / 45000;
}
export const SITE = { name: 'toolhype', tagline: 'AI tools + software, ranked by builders and buzz on X' };
