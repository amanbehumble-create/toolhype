import type { APIRoute } from 'astro'; import { getAgents, type Agent } from '../../../lib/agents'; import { agentOg } from '../../../lib/agent-og';
export const getStaticPaths = () => getAgents().map((a) => ({ params: { slug: a.slug }, props: { a } }));
export const GET: APIRoute = async ({ props }) => new Response(await agentOg((props as { a: Agent }).a), { headers: { 'Content-Type': 'image/png' } });
