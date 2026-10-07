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
└── trending.md                   # Header entry for the /trending pages (rendered by pages/trending.vue)

pages/
├── support.vue                   # /support — how to fund the project
├── trending.vue                  # /trending and /trending/<day> — the day's repos, baselines, the week
├── trending-week.vue             # /trending/week/<ISO week> — every repo that trended that week
└── trending-repo.vue             # /trending/<owner>/<repo> — findings with code, every appearance
```

The `pages/` routes live outside Nuxt Content, so they are registered explicitly in `nuxt.config.ts` (`pages:extend`), the sitemap route (`server/routes/sitemap.xml.ts`) and the `llms` section list.

### Trending data

`.github/workflows/trending.yml` runs `scripts/analyze-trending.mjs` daily: it clones the day's GitHub trending repositories and measures each one with jscpd twice, over every file and over the code alone (`scripts/trending-scan.mjs` holds the rules: no tests, docs, data, vendored or generated files, programming-language formats only). Snapshots land in `data/trending/<day>.json`; `scripts/build-trending-index.mjs` derives the history, the per-repo and per-week files, the per-language baselines; `server/routes/trending/code-only.jscpd.json.ts` serves the code scan's config so a reader can measure their own repo the same way. `scripts/backfill-trending.mjs` re-measures past days at their recorded commits when the scan rules change.

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
