# Analytics (all free, all private)

## 1. Cloudflare Web Analytics: true daily visitors
- Real browsers only (JS beacon, no cookies). Dashboard: Cloudflare > **Analytics & Logs > Web Analytics** > toolhype.dev (site tag 3a5234f2ccce48ebb799b6879432def4).
- Beacon in `src/layouts/Base.astro` (token f8769e39a55648cabd350783a6a24eea). CSP in `public/_headers` allows static.cloudflareinsights.com + cloudflareinsights.com.

## 2. First-party events: which pages and buttons people use
- Client: inline script at the bottom of `Base.astro`. Sends via `navigator.sendBeacon('/api/e')`:
  - `view` once per page load (label = referrer host; element = `ref:<value>` when the landing URL has `?ref=` or `utm_source=`, lowercased, `[a-z0-9_.-]`, max 32 chars). The param is then stripped from the address bar and kept in `sessionStorage` (`th:ref`) so `submit` events in that session get label `ref:<value>`.
  - `click` on any link/button: element = `data-track` value, else `<data-track-zone>:<href>` (e.g. `topnav:/new`, `sidenav:/buzz`, `footer:/rss.xml`, `*:visit` for /go links)
  - `submit` on subscribe forms (`sub:<placement>`), `search` (debounced search box text)
- Server: `functions/api/e.ts` -> D1 `toolhype-clicks`, table `events(id, ts, kind, page, element, label, country, ua_class, ip_hash)`. Validates kinds, caps lengths (body 1 KB, page 200, element/label 80), drops bots/our scans, checks Origin, 60 events / IP-hash / 10 min. Stores no raw IP (daily-salted hash only).
- Tags: `sub:sidebar|feed|tool-page|prompt-issue|newsletter-page|prompts-index|subbar`, `xfollow:sidebar|footer`, `xhi:sidebar|footer`, `card:open`, `card:upvote`, `visit:tool-page`, `tab:hot|buzz|new|top|rising`, `search`, `theme`, `buzz:row`; zones `topnav`, `sidenav`, `sidebar`, `footer`.
- Report: `node scripts/events-report.mjs [days]` (daily pageviews/visitors, views+CTR per page, top elements per page, top searches, referrers incl. `[ref:…]`, tagged-link landings/submits, share-button clicks).
- Ref links: Adrian's X posts use `?ref=x` (add a suffix per post if wanted, e.g. `?ref=x-agents`). Site share buttons add `?ref=x-share` (Share on X), `?ref=link` (Copy link) and `?ref=x-submitted` (post-submission share). Share clicks log as `share:x:<where>` / `share:copy:<where>`.
- Quick SQL: `SELECT element, COUNT(*) n, COUNT(DISTINCT ip_hash) v FROM events WHERE kind='view' AND element LIKE 'ref:%' GROUP BY element ORDER BY n DESC;`

## 3. Excluding our own traffic
- Our scripts must send `User-Agent: toolhype-scan/1.0` (or append `?scan=1` to /go links). `/go` and `/api/e` skip `toolhype-scan`, bare `node`, curl/python/headless and other bots. The client script also skips `navigator.webdriver` (automated browsers).

## Tool submissions (/submit)
Form posts to `functions/api/submit.ts` → private D1 `toolhype-clicks`, table `submissions`
(id, ts UTC, name, url, pitch, email, x_handle, status default 'new', country, ip_hash = daily-salted hash, no raw IP).
Spam guards: honeypot `website`, Origin check, length limits, URL/email/handle validation, 5 per IP-hash per hour.

List: `node scripts/submissions-report.mjs [new]` or
```sql
SELECT id, ts, name, url, email, x_handle, status, country, pitch FROM submissions ORDER BY ts DESC;
```
Mark reviewed: `UPDATE submissions SET status='approved' WHERE id=?;` (or 'rejected').
