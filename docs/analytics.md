# Analytics (all free, all private)

## 1. Cloudflare Web Analytics: true daily visitors
- Real browsers only (JS beacon, no cookies). Dashboard: Cloudflare > **Analytics & Logs > Web Analytics** > toolhype.dev (site tag 3a5234f2ccce48ebb799b6879432def4).
- Beacon in `src/layouts/Base.astro` (token f8769e39a55648cabd350783a6a24eea). CSP in `public/_headers` allows static.cloudflareinsights.com + cloudflareinsights.com.

## 2. First-party events: which pages and buttons people use
- Client: inline script at the bottom of `Base.astro`. Sends via `navigator.sendBeacon('/api/e')`:
  - `view` once per page load (label = referrer host)
  - `click` on any link/button: element = `data-track` value, else `<data-track-zone>:<href>` (e.g. `topnav:/new`, `sidenav:/buzz`, `footer:/rss.xml`, `*:visit` for /go links)
  - `submit` on subscribe forms (`sub:<placement>`), `search` (debounced search box text)
- Server: `functions/api/e.ts` -> D1 `toolhype-clicks`, table `events(id, ts, kind, page, element, label, country, ua_class, ip_hash)`. Validates kinds, caps lengths (body 1 KB, page 200, element/label 80), drops bots/our scans, checks Origin, 60 events / IP-hash / 10 min. Stores no raw IP (daily-salted hash only).
- Tags: `sub:sidebar|feed|tool-page|prompt-issue|newsletter-page|prompts-index|subbar`, `xfollow:sidebar|footer`, `xhi:sidebar|footer`, `card:open`, `card:upvote`, `visit:tool-page`, `tab:hot|buzz|new|top|rising`, `search`, `theme`, `buzz:row`; zones `topnav`, `sidenav`, `sidebar`, `footer`.
- Report: `node scripts/events-report.mjs [days]` (daily pageviews/visitors, views+CTR per page, top elements per page, top searches, referrers).

## 3. Excluding our own traffic
- Our scripts must send `User-Agent: toolhype-scan/1.0` (or append `?scan=1` to /go links). `/go` and `/api/e` skip `toolhype-scan`, bare `node`, curl/python/headless and other bots. The client script also skips `navigator.webdriver` (automated browsers).
