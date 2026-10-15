// Vote API. v1: localStorage (one vote per device, optimistic).
// TODO(supabase): implement remoteVote/remoteCounts with supabase-js using PUBLIC_SUPABASE_URL/ANON_KEY.
const KEY = 'th:votes';
type Store = Record<string, 1>;
const read = (): Store => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
export const hasVoted = (slug: string) => !!read()[slug];
export function toggle(slug: string): boolean {
  const s = read(); const on = !s[slug];
  if (on) s[slug] = 1; else delete s[slug];
  localStorage.setItem(KEY, JSON.stringify(s));
  remoteVote(slug, on).catch(() => {/* rollback hook for when remote exists */});
  return on;
}
export async function remoteVote(_slug: string, _up: boolean): Promise<void> { /* stub */ }
export async function remoteCounts(_slugs: string[]): Promise<Record<string, number>> { return {}; }
