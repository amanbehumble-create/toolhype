// Shared D1 access for the creator drip. ONLY rows whose release_date (HKT) has arrived are ever returned.
// Parked creators (release 2099-12-31) and future drops are never selected.
import type { BadgeCreator } from '../../src/lib/badge';
export interface Env { DB?: D1Database; ASSETS: Fetcher }
export type Row = { seq: number; release_date: string; handle: string; name: string; followers: number; section: string; descriptor: string; tools: string };
export const ESSENTIALS = 16, TOTAL = 98;
const HKT = 8 * 3600e3;
export const todayHKT = (now = Date.now()) => new Date(now + HKT).toISOString().slice(0, 10);
export const nextUnlockMs = (now = Date.now()) => { const d = new Date(now + HKT); d.setUTCHours(24, 0, 0, 0); return d.getTime() - HKT; };
/** Released drip rows, oldest first. */
export const released = async (env: Env): Promise<Row[]> => {
  if (!env.DB) return [];
  try { return (await env.DB.prepare("SELECT seq, release_date, handle, name, followers, section, descriptor, tools FROM creator_drip WHERE pack = 'starter-pack-1' AND release_date <= ? ORDER BY release_date ASC, seq ASC").bind(todayHKT()).all<Row>()).results ?? []; } catch { return []; }
};
export const toBadge = (r: Row, drop: number): BadgeCreator => {
  let tools: string[] = []; try { tools = JSON.parse(r.tools || '[]'); } catch {}
  return { handle: r.handle, name: r.name, followers: r.followers, section: r.section, descriptor: r.descriptor, avatar: `/creators/av/${r.handle}.webp`, drop, unlocked: r.release_date, tools: tools.map((t) => ({ slug: t, name: t })) };
};
/** Released creators as badges with drop numbers continuing after the 16 Essentials. */
export const releasedBadges = async (env: Env) => (await released(env)).map((r, i) => toBadge(r, ESSENTIALS + i + 1));
