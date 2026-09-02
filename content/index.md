---
seo:
  title: jscpd - Copy/Paste Detector for Source Code
  description: Detect copy/paste and duplicated code in your projects. Rust engine, self-contained binary, no Node.js runtime required. Supports 224 programming languages.
  ogImage: https://jscpd.dev/og.png
---

::u-page-hero
---
orientation: horizontal
links:
  - label: Hunt Duplicates
    color: primary
    size: xl
    to: /getting-started/installation
    trailing-icon: i-lucide-arrow-right
    class: btn-glow
  - label: Support the project
    color: neutral
    size: xl
    to: /support
    variant: ghost
    icon: i-lucide-heart
---
#title
Copy/Paste Detector for Source Code

#description
**jscpd** is a Rust-powered copy/paste detector that hunts down duplicated blocks across **224 languages** — because life's too short to maintain the same bug in five different places. One self-contained binary, no Node.js runtime required. AI-ready with the `--reporters ai` flag and a built-in MCP server.

#default
  :::install-command
  :::

  :::git-hub-stars
  :::

  :::home-seo
  :::
::

::u-page-section
#title
Why Developers Love <span class="hero-gradient">jscpd</span>

#description
Because clean code is happy code

#features
  :::u-page-feature
  ---
  icon: i-lucide-award
  ---
  #title
  Since 2013

  #description
  A decade of refining the art of duplicate detection. Now rewritten in Rust for native performance — no Node.js runtime required.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-globe
  ---
  #title
  Speaks 224 Languages

  #description
  JavaScript, Python, Java, Go, Rust, C++, TypeScript, Ruby... If you can write it, we can scan it. Vue, Svelte, Astro, and Markdown cross-format detection too.

  <a href="/getting-started/supported-formats" class="feature-card-link">
    View supported formats
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-download
  ---
  #title
  10M+ npm downloads / month

  #description
  One of the most trusted tools in the ecosystem. Join developers who rely on jscpd every day.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-rocket
  ---
  #title
  Blazingly Fast™

  #description
  A Rust engine with parallel detection across format groups. 159 MB codebase? 3.4 seconds. No Node.js runtime — just a single native binary.

  <a href="/benchmarks" class="feature-card-link">
    See benchmarks
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-terminal-square
  ---
  #title
  CLI-First Design

  #description
  One command to rule them all. Works everywhere — your laptop, CI/CD, that ancient Jenkins server nobody wants to touch.

  <a href="/getting-started/installation" class="feature-card-link">
    Get started
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-file-bar-chart
  ---
  #title
  Beautiful Reports

  #description
  HTML, JSON, XML, badges for your README. Make technical debt visible (and slightly embarrassing).

  <a href="/reporters" class="feature-card-link">
    Explore reporters
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-code-2
  ---
  #title
  Programmable

  #description
  Embed detection in your own tools with the Rust crates (`cpd-finder`, `cpd-core`), or drive the CLI and parse its JSON output from any language.

  <a href="/api" class="feature-card-link">
    View API documentation
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  CI/CD Ready

  #description
  Set a threshold, fail the build, save the day. Your future self will thank you.

  <a href="/getting-started/configuration" class="feature-card-link">
    Configure thresholds
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-bot
  ---
  #title
  MCP Server <span class="duplicate-badge">New</span>

  #description
  Let AI assistants like Claude check your code for duplications via the Model Context Protocol — now built into the v5 binary: `cpd --mcp` serves stdio directly, no separate server needed.

  <a href="/api/mcp-server" class="feature-card-link">
    Learn about MCP Server
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-list-ordered
  ---
  #title
  Codebase Summary <span class="duplicate-badge">New</span>

  #description
  `--summary` ranks your top files and folders by tokens, lines, size, or complexity — each with its duplication share — so you know where to refactor first.

  <a href="/getting-started/configuration" class="feature-card-link">
    See summary options
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-sparkles
  ---
  #title
  Cross-Format Detection <span class="duplicate-badge">New</span>

  #description
  Vue SFC, Svelte, Astro, and Markdown files are tokenized per-block — a `<script>` in .vue can match a .ts file. And `--cross-formats "js-ts"` compares related formats in one pool, catching clones between .js and .ts files.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-sparkles
  ---
  #title
  AI Reporter <span class="duplicate-badge">New</span>

  #description
  Compact output that saves ~79% of tokens compared to the default reporter — ideal for piping into LLMs.

  <a href="/reporters" class="feature-card-link">
    AI Reporter docs
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-trending-up
  ---
  #title
  Trending Repos, Analyzed <span class="duplicate-badge">New</span>

  #description
  How much copy/paste ships in GitHub's trending repos? A daily pipeline runs jscpd v5 on each and publishes clone counts and duplication stats.

  <a href="/trending" class="feature-card-link">
    See today's results
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-cpu
  ---
  #title
  Agent Skill <span class="duplicate-badge">New</span>

  #description
  Install a skill for your AI coding assistant to automatically detect and refactor duplications — one command to get started.

  ```bash
  npx skills add kucherenko/jscpd
  ```

  <a href="/getting-started/agent-skill" class="feature-card-link">
    Learn more
    <span class="link-arrow">→</span>
  </a>
  :::
::

::u-page-section
---
orientation: horizontal
---
#title
See It In Action

#description
From chaos to clarity in seconds

#default
```bash
# Scan your source code
$ jscpd ./src

Clone found (typescript):
 - src/utils.ts [10:1 - 25:3] (15 lines, 129 tokens)
    src/helpers.ts [5:1 - 20:3]

Clone found (typescript):
 - src/utils.ts [45:5 - 62:2] (17 lines, 178 tokens)
    src/components/Button.tsx [12:1 - 29:2]

Clone found (javascript):
 - src/hooks/useAuth.ts [1:1 - 34:2] (33 lines, 245 tokens)
    src/hooks/useSession.ts [1:1 - 34:2]

# ... more clones

Found 90 clones.
Detection time: 13ms
```
::

::u-page-section
---
orientation: horizontal
---
#title
Fresh from <span class="hero-gradient">GitHub Trending</span>

#description
Every day we run jscpd v5 over GitHub's trending repositories and publish how much copy/pasted code they ship — clone counts, duplication rates, and the largest duplicated blocks.

#default
<TrendingPreview />
::

::u-page-section
#title
Who Uses <span class="hero-gradient">jscpd</span>

#description
From GitHub's official linter to enterprise codebases

#default
<WhoUses />
::

::u-page-section
#title
Developers Are Talking

#description
Real mentions from the community on X

#default
<TweetWall />
::

::u-page-section
---
orientation: horizontal
reverse: true
---
#title
💙 Huge Thank You to Our Contributors!

#description
This project wouldn't exist without you

#default
  :::u-card
  #default
  **To everyone who has contributed to jscpd — thank you!** 🌟

  Whether you've submitted code, reported bugs, suggested features, improved documentation, or simply spread the word — your contributions make jscpd better for everyone. We're grateful for every issue closed, every PR merged, and every kind word shared.

  **With a grateful heart,** 🤗

  _The jscpd Team_

  [:icon{name="simple-icons-github" class="inline"} View Contributors](https://github.com/kucherenko/jscpd/graphs/contributors)
  :::
::
