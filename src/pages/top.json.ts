import { getTools } from '../lib/data';
import { topTools } from '../lib/top';
export const GET = () => new Response(JSON.stringify({ top: topTools(5), feature: Object.fromEntries(getTools().map((t) => [t.slug, t.name])) }), { headers: { 'Content-Type': 'application/json' } });
