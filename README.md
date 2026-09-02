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
├── 1.getting-started/            # Getting started guides
│   ├── 2.introduction.md
│   ├── 3.installation.md
│   ├── 4.configuration.md
│   ├── 5.supported-formats.md
│   ├── 6.agent-skill.md
│   ├── 7.changelog.md
│   └── 8.migration.md
├── 2.ci-and-hooks/               # CI pipelines and git hooks
│   ├── 1.index.md
│   ├── 2.ci.md
│   └── 3.pre-commit.md
├── 3.reporters/                  # Reporter documentation
│   ├── 1.index.md
│   ├── 2.html.md
│   ├── 3.json.md
│   ├── 4.badge.md
│   ├── 5.sarif.md
│   ├── 6.codeclimate.md
│   └── 7.openmetrics.md
├── 4.benchmarks/                 # Comparisons with other CPD tools
│   ├── 1.index.md
│   ├── 2.detection-speed.md
│   ├── 3.cross-format.md
│   └── 4.ai-token-efficiency.md
├── 5.api/                        # API documentation
│   ├── 1.index.md
│   ├── 2.core.md
│   ├── 3.server.md
│   └── 4.mcp-server.md
└── 6.trending.md                 # Daily GitHub-trending analysis (data/trending.json)

pages/
├── support.vue                   # /support — how to fund the project
└── trending.vue                  # /trending — standalone layout for the trending data
```

Both `pages/` routes live outside Nuxt Content, so they are registered explicitly in `nuxt.config.ts` (`pages:extend`), the sitemap route (`server/routes/sitemap.xml.ts`) and the `llms` section list.

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
