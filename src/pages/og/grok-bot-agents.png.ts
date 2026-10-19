import type { APIRoute } from 'astro'; import { sectionOg } from '../../lib/agent-og';
export const GET: APIRoute = async () => new Response(await sectionOg(), { headers: { 'Content-Type': 'image/png' } });
