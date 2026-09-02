---
seo:
  title: jscpd - Copy/Paste Detector for Source Code
  description: Copy/paste detector for source code that finds duplicated blocks across 224 languages and fails the build when they cross your threshold - a native Rust binary with an MCP server, an agent skill, and an LLM-friendly reporter.
  ogImage: https://jscpd.dev/og.png
---

::u-page-hero
---
orientation: horizontal
---
#title
Copy/Paste Detector for Source Code

#description
**Agents copy. Reviewers miss it. Your build shouldn't.** jscpd finds duplicated blocks across **224 languages** and fails the build when they cross your threshold. Native Rust binary, no runtime: a 159 MB codebase scans in 3.4 seconds. Speaks MCP, ships an agent skill, and reports in a format LLMs can afford to read.

#links
  :::u-button
  ---
  label: Add to CI
  to: /ci-and-hooks/ci
  color: primary
  size: xl
  trailing-icon: i-lucide-arrow-right
  class: btn-glow
  ---
  :::

  :::git-hub-stars
  :::

  :::u-button
  ---
  label: Support the project
  to: /support
  color: neutral
  size: xl
  variant: ghost
  icon: i-lucide-heart
  ---
  :::

#default
  :::install-command
  :::

  :::home-seo
  :::
::

::u-page-section
#title
Built for codebases where <span class="hero-gradient">agents</span> write code

#description
Agents repeat helpers. Each diff reads fine on its own. Review can't catch it — a failing build can.

#features
  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  Gate it

  #description
  ```bash
  jscpd . --threshold 3
  ```

  Runs in pre-commit and CI. *"An agent will argue a comment, but a failing build just stops it."* — @nark3d

  <a href="/ci-and-hooks/ci" class="feature-card-link">
    Set up the gate
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-bot
  ---
  #title
  Let the agent check itself

  #description
  ```bash
  jscpd --mcp
  ```

  MCP server built into the binary. Claude, Cursor, or any MCP client checks for clones before writing more.

  <a href="/api/mcp-server" class="feature-card-link">
    MCP server docs
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-graduation-cap
  ---
  #title
  Teach it to refactor

  #description
  ```bash
  npx skills add kucherenko/jscpd
  ```

  One skill: detect duplicates, propose the extraction, verify the count went down.

  <a href="/getting-started/agent-skill" class="feature-card-link">
    Install the agent skill
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-sparkles
  ---
  #title
  Feed the LLM, not the context window

  #description
  ```bash
  jscpd . --reporters ai
  ```

  About 79% fewer tokens than the default reporter. Pipe it straight into your agent loop.

  <a href="/benchmarks/ai-token-efficiency" class="feature-card-link">
    See the token benchmark
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-list-ordered
  ---
  #title
  Know where to start

  #description
  ```bash
  jscpd . --summary
  ```

  Files ranked by tokens, lines, or complexity, each with its duplication share. Refactor the worst first.

  <a href="/getting-started/configuration#codebase-summary-where-to-refactor-first" class="feature-card-link">
    Summary options
    <span class="link-arrow">→</span>
  </a>
  :::
::

::u-page-section
#title
How teams wire it

#description
Three places, one binary. Add any of them in under a minute.

#features
  :::u-page-feature
  ---
  icon: i-lucide-git-commit-horizontal
  ---
  #title
  1. Pre-commit

  #description
  Block the commit before the clone lands.

  ```bash
  # .husky/pre-commit
  npx jscpd --threshold 3 .
  ```

  <a href="/ci-and-hooks/pre-commit" class="feature-card-link">
    Pre-commit and Husky setup
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-workflow
  ---
  #title
  2. CI gate

  #description
  Fail the pull request when duplication crosses the line.

  ```yaml
  # .github/workflows/jscpd.yml
  - uses: kucherenko/jscpd@v5
    with:
      threshold: 3
  ```

  <a href="/ci-and-hooks/ci" class="feature-card-link">
    GitHub Action, GitLab CI, generic CI
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-bot
  ---
  #title
  3. Agent loop

  #description
  Give the agent the same detector, over MCP.

  ```json
  // MCP client config
  { "mcpServers": { "jscpd": {
      "command": "jscpd", "args": ["--mcp", "."] } } }
  ```

  <a href="/api/mcp-server" class="feature-card-link">
    Connect Claude, Cursor, or Copilot
    <span class="link-arrow">→</span>
  </a>
  :::
::

::u-page-section
#title
Core

#description
Detection that has been refined since 2013 — now a native Rust engine

#features
  :::u-page-feature
  ---
  icon: i-lucide-award
  ---
  #title
  Since 2013

  #description
  A decade of refining the art of duplicate detection. Now rewritten in Rust for native performance — no Node.js runtime required.

  <a href="/getting-started/introduction" class="feature-card-link">
    How detection works
    <span class="link-arrow">→</span>
  </a>
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
  icon: i-lucide-sliders-horizontal
  ---
  #title
  Thresholds & Baselines

  #description
  Set a threshold and fail the build. Or commit a baseline and fail only on clones that are new since the last run.

  <a href="/getting-started/configuration" class="feature-card-link">
    Configure thresholds
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-sparkles
  ---
  #title
  Cross-Format Detection

  #description
  Vue SFC, Svelte, Astro, and Markdown files are tokenized per-block — a `<script>` in .vue can match a .ts file. And `--cross-formats "js-ts"` compares related formats in one pool, catching clones between .js and .ts files.

  <a href="/benchmarks/cross-format" class="feature-card-link">
    Cross-format benchmark
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-user-round-search
  ---
  #title
  Git Blame

  #description
  `--blame` annotates every clone with the authors from git history, so you know who to ask before you refactor.

  <a href="/getting-started/configuration" class="feature-card-link">
    All CLI options
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

  <a href="https://www.npmjs.com/package/jscpd" class="feature-card-link">
    View on npm
    <span class="link-arrow">→</span>
  </a>
  :::
::

::u-page-section
#title
Integrations

#description
Plug it into the tools you already run

#features
  :::u-page-feature
  ---
  icon: i-lucide-github
  ---
  #title
  GitHub Action

  #description
  `uses: kucherenko/jscpd@v5` — scans the repository, fails on threshold, and uploads SARIF to Code Scanning. No install step.

  <a href="/ci-and-hooks/ci" class="feature-card-link">
    GitHub Action docs
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-git-commit-horizontal
  ---
  #title
  Pre-commit Hooks

  #description
  Works with the `pre-commit` framework, Husky, or a plain shell hook in `.git/hooks`. Blocks the commit when duplication exceeds the threshold.

  <a href="/ci-and-hooks/pre-commit" class="feature-card-link">
    Pre-commit docs
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  SARIF / Code Scanning

  #description
  `--reporters sarif` writes a SARIF file that GitHub Code Scanning renders as inline alerts on the pull request.

  <a href="/reporters/sarif" class="feature-card-link">
    SARIF reporter docs
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-gitlab
  ---
  #title
  GitLab CI

  #description
  The `codeclimate` reporter feeds GitLab Code Quality and `openmetrics` feeds its metrics reports, so duplication shows up on the merge request.

  <a href="/ci-and-hooks/ci#gitlab-ci" class="feature-card-link">
    GitLab CI docs
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
  icon: i-lucide-trending-up
  ---
  #title
  Trending Repos, Analyzed

  #description
  How much copy/paste ships in GitHub's trending repos? A daily pipeline runs jscpd v5 on each and publishes clone counts and duplication stats.

  <a href="/trending" class="feature-card-link">
    See today's results
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

Clone found (typescript):
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
#title
Contributors

#description
jscpd is built by its contributors. Bug reports, formats, reporters, docs — every one of them is on this list.

#default
<a href="https://github.com/kucherenko/jscpd/graphs/contributors" target="_blank" rel="noopener" class="contributors-link">
  <img src="https://contrib.rocks/image?repo=kucherenko/jscpd" alt="Avatars of the people who have contributed to jscpd on GitHub" loading="lazy" width="890" height="300" />
</a>
::
