# Prompt Drop: how prompts are selected

Hard rules (set by Adrian, Oct 2026):

1. **100+ likes.** Every prompt must come from an X post with at least 100 likes. Check the count with real X data (the free public `x` MCP: `search_posts_all`, `get_posts_by_ids`). Never estimate or make up a count.
2. **Word-for-word.** The prompt text has to appear in that post, or in the same author's own thread replies under it (use `conversation_id:<id> from:<author>`). Never write or "complete" a prompt ourselves. Only `[brackets]` placeholders that the author wrote are allowed.
3. **Recent.** The post should be from roughly the last 30 days.
4. **Beginner-friendly.** Copy-paste ready, with a mix of chat (ChatGPT/Claude/Grok/Gemini), image, productivity, learning and writing prompts.
5. **Show proof.** Every prompt shows the author handle, a link to the post (plus a link to the thread reply when the prompt lives there), and "N likes as of <date HKT>". The like count is always for the main post.

Data lives in `src/data/prompts.json` (`likes`, `likesAsOf`, `source`, `promptSource`).
