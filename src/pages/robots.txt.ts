import type { APIRoute } from 'astro';
const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'xAI-Bot', 'GrokBot', 'Bytespider', 'meta-externalagent'];
export const GET: APIRoute = ({ site }) => new Response(
  ['User-agent: *', 'Allow: /', '', ...bots.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']), `Sitemap: ${new URL('/sitemap.xml', site)}`].join('\n'),
  { headers: { 'Content-Type': 'text/plain' } });
