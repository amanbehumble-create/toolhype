// Fills the creator-drip marker in llms.txt with released daily-drip creators only.
import { type Env, releasedBadges } from './_lib/drip';
import { displayName } from '../src/lib/badge';
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const res = await ctx.next();
  if (!res.ok) return res;
  const txt = await res.text();
  const lines = (await releasedBadges(ctx.env)).map((c) => `- [${displayName(c)} (@${c.handle})](https://toolhype.dev/creators/${c.handle}): ${c.descriptor} (unlocked ${c.unlocked})`).join('\n');
  return new Response(txt.replace(/^<!-- creator-drip -->\n?/m, lines ? lines + '\n' : ''), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate' } });
};
