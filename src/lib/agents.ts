import aj from '../data/agents.json';
export interface Agent {
  slug: string; name: string; description: string; templateUrl: string;
  creatorHandle: string | null; creatorName?: string | null; sourcePostUrl: string | null; category: string;
  traction: { likes: number; bookmarks: number; reposts?: number; replies?: number; checkedAt: string } | null; why?: string; addedAt: string;
}
const score = (a: Agent) => (a.traction ? a.traction.likes + a.traction.bookmarks + (a.traction.reposts ?? 0) + (a.traction.replies ?? 0) : -1);
export const getAgents = (): Agent[] => [...(aj as Agent[])].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
export const agentCategories = () => [...new Set(getAgents().map((a) => a.category))].sort();
export const creatorLabel = (a: Agent) => (a.creatorHandle ? `@${a.creatorHandle}` : a.creatorName || 'Unknown creator');
export const AGENTS_INTRO = 'Ready-to-use Grok Bot agents you can copy in one click.';
