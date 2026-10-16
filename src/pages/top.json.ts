import { topTools } from '../lib/top';
export const GET = () => new Response(JSON.stringify({ top: topTools(5) }), { headers: { 'Content-Type': 'application/json' } });
