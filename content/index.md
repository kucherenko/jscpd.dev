---
seo:
  title: jscpd - Copy/Paste Detector for Source Code
  description: Detect copy/paste and duplicated code in your projects. Rust-powered native binary, 24-37x faster. Supports 223+ programming languages.
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
  - label: Sponsor the project
    color: neutral
    size: xl
    to: https://opencollective.com/jscpd
    target: _blank
    variant: ghost
    icon: i-lucide-heart
---
#title
Copy/Paste Detector for Source Code

#description
**jscpd v5** is a Rust-powered rewrite that hunts down duplicated blocks across **223+ languages** up to **37x faster** than v4 — because life's too short to maintain the same bug in five different places. Need the Node.js API? v4 is still available. AI-ready with the `--reporters ai` flag.

#default
<InstallCommand />
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
  Speaks 223+ Languages

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
  20M+ Downloads

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
  Rewritten in Rust. 24-37x faster than the TypeScript engine. 159 MB codebase? 3.4 seconds. No Node.js runtime — just a single native binary.

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
  v5: Rust crate API. v4: Node.js API. Same CLI in both. Use whichever fits your stack.

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
v5 vs v4: Performance

#description
The Rust engine makes jscpd 24–37x faster across every codebase size.

#default
| Target | Files | Size | v4 (TypeScript) | v5 (Rust) | Speedup |
|--------|-------|------|------------------|-----------|---------|
| fixtures | 548 | 1.5 MB | 1.03s | 0.03s | **34.3x** |
| Svelte | 8,963 | 38 MB | 15.80s | 0.43s | **36.9x** |
| CopilotKit | 17,092 | 159 MB | 82.89s | 3.44s | **24.1x** |

_Benchmarked on macOS (Apple Silicon). See the [Migration Guide](/getting-started/migration) for full details._
::

::u-page-section
---
orientation: horizontal
---
#title
Built by a Human Who Gets It

#description
Created with ❤️ by Andrey Kucherenko

#default
  :::u-card
  #default
  <div class="flex flex-col sm:flex-row items-center gap-6">
    <img
      src="https://avatars.githubusercontent.com/kucherenko?v=4&size=128"
      alt="Andrey Kucherenko"
      class="w-24 h-24 rounded-full ring-4 ring-primary/20 shadow-xl flex-shrink-0 pointer-events-none"
      loading="lazy"
    >
    <div class="text-center sm:text-left">
      <p class="mb-4 text-muted">
        Andrey Kucherenko believes that every copy-pasted code block is a bug waiting to happen twice.
        He built jscpd so you don't have to fix the same issue in five files.
      </p>
      <div class="flex flex-wrap justify-center sm:justify-start gap-3">
        <a href="https://github.com/kucherenko" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium transition-colors">
          <span class="i-simple-icons:github w-4 h-4"></span> GitHub
        </a>
        <a href="https://x.com/a_kucherenko" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium transition-colors">
          <span class="i-simple-icons:x w-4 h-4"></span> X
        </a>
      </div>
    </div>
  </div>
  :::
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
