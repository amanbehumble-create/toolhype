// "Why it's buzzing" selection rule (see docs/buzz-top-posts.md).
// A post qualifies only if: >=100 likes OR >=10K views, it's an original post (not a reply/retweet),
// and its text actually mentions the tool (a keyword from its buzz query) and doesn't hit the tool's exclude list.
// Qualifying posts are ranked by engagement and the top 3 are shown; if none qualify the section is hidden.
export const MIN_LIKES = 100, MIN_VIEWS = 10000, MIN_LIKES_WITH_VIEWS = 10, SHOW = 3; // views-only posts still need 10+ likes (filters zero-like promos)
export const engagement = (p) => p.likes + 3 * p.reposts + 2 * p.replies + 2 * (p.quotes || 0) + (p.views || 0) / 100;
// Per-tool exclusions for ambiguous names (e.g. "figma" is also a toy-figure line).
export const EXCLUDE = {
  figma: /figure|フィギュア|figma\S*ちゃん|#figma|\bfigma\s*(?:no|\d)|max factory|グッドスマイル|予約|fate|ねんどろいど/i,
  claude: /claude monet|van damme/i,
  make: /^/, // generic word; only accept posts that say make.com / "make.com"
};
export function keywords(query) {
  const k = new Set();
  for (const m of query.matchAll(/"([^"]+)"/g)) k.add(m[1].toLowerCase());
  for (const m of query.matchAll(/url:([\w.\-\/]+)/g)) k.add(m[1].toLowerCase());
  for (const m of query.matchAll(/@(\w+)/g)) k.add(m[1].toLowerCase());
  const bare = query.replace(/"[^"]+"/g, ' ').replace(/url:\S+/g, ' ').replace(/-\S+/g, ' ').replace(/[()]/g, ' ');
  for (const w of bare.split(/\s+/)) if (w && !/^(OR|AND|lang:\w+)$/i.test(w) && w.length >= 4) k.add(w.toLowerCase().replace(/^@/, ''));
  return [...k];
}
export function selectTop(slug, query, posts) {
  const kw = keywords(query), ex = EXCLUDE[slug];
  const seen = new Set();
  return posts.filter((p) => {
    if (!p || seen.has(p.id)) return false; seen.add(p.id);
    const t = (p.text || '').toLowerCase();
    if (p.isReply || /^@\w+/.test(p.text || '') || /^rt @/i.test(p.text || '')) return false;
    if (!(p.likes >= MIN_LIKES || ((p.views || 0) >= MIN_VIEWS && p.likes >= MIN_LIKES_WITH_VIEWS))) return false;
    if (ex && slug !== 'make' && ex.test(p.text || '')) return false;
    // relevance: the tool must be named in the post text itself (a bare link to e.g. a notion.so page doesn't count)
    const key = t.replace(/https?:\/\/\S+/g, '').slice(0, 80);
    if (seen.has(key)) return false; seen.add(key);
    return kw.some((k) => t.replace(/https?:\/\/\S+/g, ' ').includes(k.replace(/^url:/, '')));
  }).sort((a, b) => engagement(b) - engagement(a)).slice(0, SHOW);
}
// Normalize an X API v2 search/lookup payload.
export function normalize(j) {
  const users = Object.fromEntries((j?.includes?.users || []).map((u) => [u.id, u.username]));
  return (j?.data || []).map((x) => ({ id: x.id, url: x.url || `https://x.com/${users[x.author_id] || 'i'}/status/${x.id}`, author: users[x.author_id] || null,
    text: (x.note_tweet?.text || x.text || '').slice(0, 280), created_at: x.created_at, likes: x.public_metrics?.like_count || 0,
    reposts: x.public_metrics?.retweet_count ?? x.public_metrics?.repost_count ?? 0, replies: x.public_metrics?.reply_count || 0, views: x.public_metrics?.impression_count ?? null,
    quotes: x.public_metrics?.quote_count || 0, isReply: !!(x.in_reply_to_user_id || (x.referenced_tweets || []).some((r) => r.type !== 'quoted')),
    urls: (x.entities?.urls || []).map((u) => u.expanded_url || '') }));
}
