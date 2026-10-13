# jscpd.dev

Official documentation website for [jscpd](https://github.com/kucherenko/jscpd) - Copy/Paste Detector for programming source code.

## 🌐 Website

Visit: **[jscpd.dev](https://jscpd.dev)**

## 🛠️ Development

This site is built with [Docus](https://docus.dev) (Nuxt-based documentation theme).

### Prerequisites

- Node.js 18+
- Bun (or npm/yarn/pnpm)

### Install dependencies

```bash
bun install
```

### Start development server

```bash
bun run dev
```

### Build for production

```bash
bun run build
```

## 📁 Structure

```
content/
├── index.md                      # Landing page
├── 1.start/                      # What jscpd finds, installation, quickstart, configuration basics
├── 2.guides/                     # One task per page: CI, hooks, baseline, agents, editors, dead code, ...
├── 3.concepts/                   # Clone types, how detection works, the health score
├── 4.reference/                  # CLI options (generated), config file, exit codes, reporters, formats (generated), Action (generated), crates
├── 5.project/                    # Changelog, migration, v4, benchmarks, research, articles
├── blog/                         # Posts, one file each (the `blog` collection in content.config.ts)
└── trending.md                   # Header entry for the /trending pages (rendered by pages/trending.vue)

pages/
├── blog.vue                      # /blog — the list of posts, newest first
├── blog-post.vue                 # /blog/<slug> — one post, with its authors and table of contents
├── support.vue                   # /support — how to fund the project
├── trending.vue                  # /trending and /trending/<day> — the day's repos, baselines, the week
├── trending-week.vue             # /trending/week/<ISO week> — every repo that trended that week
└── trending-repo.vue             # /trending/<owner>/<repo> — findings with code, every appearance
```

The `pages/` routes live outside Nuxt Content, so they are registered explicitly in `nuxt.config.ts` (`pages:extend`), the sitemap route (`server/routes/sitemap.xml.ts`) and the `llms` section list.

### Blog

A post is a Markdown file in `content/blog/`, with `title`, `description`, `date` (YYYY-MM-DD), `publishedAt` (an ISO instant, UTC) and `authors` in its front matter. A post whose `publishedAt` is still ahead is left out of the list, the feed, the sitemap and llms.txt, and its page is not generated; the deploy workflow rebuilds the site every day at 08:05 UTC, so a post scheduled for a morning goes live with that build (or sooner, if something else is deployed after its time). Author ids map to names, GitHub and X links in `data/authors.ts`. `content.config.ts` keeps the posts in their own `blog` collection, so they stay out of the docs navigation and search; the list is `pages/blog.vue`, a post is `pages/blog-post.vue`, and `server/routes/blog/feed.xml.ts` writes the Atom feed at `/blog/feed.xml`. Comments under a post come from [giscus](https://giscus.app) (`components/BlogComments.vue`): each post is a GitHub Discussion in this repository's Announcements category, matched by pathname, so the giscus app has to stay installed on the repository.

### Trending data

`.github/workflows/trending.yml` runs `scripts/analyze-trending.mjs` daily: it clones the day's GitHub trending repositories and measures each one with jscpd twice, over every file and over the code alone (`scripts/trending-scan.mjs` holds the rules: no tests, docs, data, vendored or generated files, programming-language formats only). Snapshots land in `data/trending/<day>.json`; `scripts/build-trending-index.mjs` derives the history, the per-repo and per-week files, the per-language baselines; `server/routes/trending/code-only.jscpd.json.ts` serves the code scan's config so a reader can measure their own repo the same way. `scripts/backfill-trending.mjs` re-measures past days at their recorded commits when the scan rules change.

### Site statistics

`.github/workflows/analytics.yml` runs `scripts/analytics-snapshot.mjs` every morning at 07:45 UTC, before the daily rebuild. The script reads Cloudflare Web Analytics through the GraphQL API (an API token with Account Analytics: Read in the `CLOUDFLARE_ANALYTICS_TOKEN` secret; the site tag is the beacon token in the page HTML) and stores each day's page views and visits per path in `data/analytics/months/<month>.json`, and the breakdowns of the last 30 days in `data/analytics/window.json`. The last seven days are rewritten on every run, older days stay as stored, so the site keeps its own history past the API's retention. `composables/useSiteStats.ts` reads the files: `/stats` (`pages/stats.vue`) shows the site, and a blog post shows its views once it has a hundred.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💙 Huge Thank You to All Contributors!

A big heartfelt thank you to everyone who has contributed to jscpd! Your time, code, ideas, and support make this project possible. Whether you've submitted code, reported issues, suggested features, or just spread the word — we appreciate you! ❤️

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## Support jscpd

- [Open Collective](https://opencollective.com/jscpd) — preferred; transparent budget, invoices for companies
- Crypto (the same addresses shown on [jscpd.dev/support](https://jscpd.dev/support) — the lists should always match):
  - Ethereum / BNB Smart Chain / Polygon: `0xf92027E8121b1734cDDC430b7B0085681d843ae2`
  - Bitcoin: `bc1q8q57dulp7jg7dzzysd2n2yw080qg80cuv48228`
  - Solana: `9JGCG3xyE23qBGxtvudo5kVMLRhAzxbrkzAfB7Cw8YkT`
  - Tron: `TTV8SYFKNhfSRe2J2WBXezSZrCvMLNXiea`
