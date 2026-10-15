# toolhype

AI tools + software, ranked by builders and buzz on X. A Reddit-style directory with upvotes, use-case communities (`c/agents`, `c/coding`…), a "new this week" feed and newsletter.

Stack: **Astro 5 + TypeScript**, fully static. It deploys to Cloudflare Pages on the free plan.

## Develop
```bash
npm install
cp .env.example .env   # optional
npm run dev            # http://localhost:4321
npm run build          # outputs to dist/
```

## Structure
- `src/data/tools.json`, `communities.json`: seed data (buzz scores stay `pending` until the X scan runs).
- `src/lib/data.ts`: data adapter. Swap it for Supabase queries later.
- `src/lib/votes.ts`: upvotes. v1 uses localStorage (one vote per device, optimistic). `remoteVote`/`remoteCounts` are Supabase stubs.
- Pages: `/`, `/new`, `/c/[slug]`, `/tools/[slug]`, `/submit`, `/newsletter`.
- SEO/AI: `sitemap.xml`, `robots.txt` (allows AI crawlers), `llms.txt`, `llms-full.txt`, `rss.xml`, JSON-LD (SoftwareApplication, ItemList, WebSite), OG/Twitter meta.
- `scripts/scan.mjs`: outline of the daily Product Hunt / GitHub / X ingestion.

## Env vars (all optional)
| Var | Purpose |
|---|---|
| `SITE_URL` | canonical domain (default https://toolhype.dev) |
| `PUBLIC_STRIPE_FEATURED_LINK` | Stripe Payment Link for featured listings |
| `PUBLIC_BEEHIIV_EMBED_URL` | Beehiiv subscribe embed URL |
| `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` | for votes/auth later |

## Deploy to Cloudflare Pages
1. In Cloudflare, go to Workers & Pages → Create → Pages → Connect to Git and pick this repo.
2. Framework preset: **Astro**. Build command: `npm run build`. Output directory: `dist`.
3. Add the env vars above (Settings → Environment variables), including `NODE_VERSION=20`.
4. Under Custom domains, add `toolhype.dev`.

## Design
The fonts are Funnel Sans and Funnel Display (body and headings) and Geist Mono (data). Geist Pixel is used for the logo and badges; it falls back to Geist Mono until its woff2 is added to `public/fonts`. The colors are black and white with a `#00bbff` accent, in light and dark themes, with 1px borders and radii of 6, 10 and 14px.
