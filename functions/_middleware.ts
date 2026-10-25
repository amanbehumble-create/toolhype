// Counts AI crawler fetches into D1 `ai_hits` (day, bot, n). Aggregate only: no IP, no URL, no UA string stored.
// Never blocks or alters the response; any failure is swallowed.
interface Env { DB?: D1Database }
const BOTS: [string, RegExp][] = [
  ['GPTBot', /GPTBot/i], ['ChatGPT-User', /ChatGPT-User/i], ['OAI-SearchBot', /OAI-SearchBot/i],
  ['ClaudeBot', /ClaudeBot/i], ['Claude-User', /Claude-(User|SearchBot)|Claude-Web|anthropic-ai/i],
  ['PerplexityBot', /Perplexity(Bot|-User)/i], ['Google-Extended', /Google-Extended|Google-CloudVertexBot|GoogleOther/i],
  ['Applebot', /Applebot/i], ['Bytespider', /Bytespider/i], ['Meta-AI', /meta-external(agent|fetcher)|FacebookBot/i],
  ['Amazonbot', /Amazonbot/i], ['CCBot', /CCBot/i], ['DuckAssistBot', /DuckAssistBot/i], ['MistralAI', /MistralAI-User/i],
  ['Grok', /xAI|GrokBot/i], ['YouBot', /YouBot/i], ['cohere-ai', /cohere-(ai|training)/i], ['Diffbot', /Diffbot/i],
];
export const onRequest: PagesFunction<Env> = async (ctx) => {
  try {
    const ua = ctx.request.headers.get('user-agent') || '';
    const m = ua && ctx.env.DB ? BOTS.find(([, re]) => re.test(ua)) : undefined;
    if (m) {
      const day = new Date().toISOString().slice(0, 10);
      ctx.waitUntil(ctx.env.DB!.prepare('INSERT INTO ai_hits (day, bot, n) VALUES (?, ?, 1) ON CONFLICT(day, bot) DO UPDATE SET n = n + 1')
        .bind(day, m[0]).run().catch(() => {}));
    }
  } catch {}
  return ctx.next();
};
