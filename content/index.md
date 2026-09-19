---
seo:
  title: jscpd - Copy/Paste Detector for Source Code
  description: Copy/paste detector for source code that finds duplicated, dead and overly complex code across 224 languages, scores overall codebase health, and fails the build when duplication crosses your threshold — a native Rust binary with an MCP server, agent skills, and an LLM-friendly reporter.
  ogImage: https://jscpd.dev/og.png
---

::u-page-hero
---
orientation: horizontal
---
#title
Copy/Paste Detector for Source Code

#description
**Agents copy. Reviewers miss it. Your build shouldn't.** jscpd reads each of **224 languages** by its own syntax, finds exact, renamed and near-miss duplicates, and fails the build when they cross your threshold. One native binary, no runtime: a 159 MB codebase scans in 3.4 seconds. It also finds dead code, ranks complexity and scores codebase health, speaks MCP, ships agent skills, and has a reporter LLMs can afford to read.

#links
  :::u-button
  ---
  label: Set up the gate
  to: "#how-teams-wire-it"
  color: primary
  size: xl
  trailing-icon: i-lucide-arrow-down
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
Agents repeat helpers. Each diff reads fine on its own, so review misses it. A failing build doesn't.

#features
  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  Gate it

  #description
  :copy-command{cmd="jscpd . --threshold 3"}

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
  :copy-command{cmd="jscpd --mcp"}

  MCP server built into the binary. Claude, Cursor or any MCP client can check for clones before writing more.

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
  :copy-command{cmd="npx skills add kucherenko/jscpd"}

  Skills that run the whole workflow: find duplicates, extract them, remove dead code, simplify complex files, then check the numbers improved.

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
  :copy-command{cmd="jscpd . --reporters ai"}

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
  :copy-command{cmd="jscpd . --dashboard"}

  One screen: a health score on top, then duplication, the most complex files and dead code. Fix the worst first.

  <a href="/guides/dashboard" class="feature-card-link">
    Project dashboard
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-scan-search
  ---
  #title
  Find what nothing runs

  #description
  :copy-command{cmd="jscpd . --dead-code"}

  Unused files, exports and imports in JavaScript, TypeScript and Python, each with a confidence score. `--complexity` ranks the most complex files without running clone detection.

  <a href="/guides/health" class="feature-card-link">
    Health score and dead code
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-chart-no-axes-combined
  ---
  #title
  Watch the trend

  #description
  :copy-command{cmd="jscpd . --history v5.0.0..HEAD"}

  One scan per commit, shown as a chart and a table in your terminal. See whether agents add duplication faster than you remove it, and how far you can tighten the threshold.

  <a href="/guides/history" class="feature-card-link">
    Duplication trend over history
    <span class="link-arrow">→</span>
  </a>
  :::
::

::u-page-section
#title
Finds the copies that don't <span class="hero-gradient">look</span> like copies

#description
Exact copies are the easy case. jscpd also reports renamed and near-miss clones, each tagged with its kind and a similarity score. Default runs are unchanged; the extra kinds are opt-in flags.

#features
  :::u-page-feature
  ---
  icon: i-lucide-copy
  ---
  #title
  Exact clones, by default

  #description
  :copy-command{cmd="jscpd ."}

  Type-1: identical tokens. Whitespace, layout and comments don't count. Every run reports these, starting from `--min-tokens 50` and `--min-lines 5`.

  <a href="/guides/clone-types#type-1-exact-clones" class="feature-card-link">
    Type-1 clones
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-replace
  ---
  #title
  Renamed clones

  #description
  :copy-command{cmd="jscpd . --ignore-identifiers --ignore-literals"}

  Type-2: the same code with different variable names or literal values. `--ignore-annotations` also drops `@Decorator` lines. Keywords keep their meaning, so `return` never matches `retry`. Reported as `renamed`.

  <a href="/guides/clone-types#type-2-renamed-clones" class="feature-card-link">
    Type-2 clones
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-diff
  ---
  #title
  Near-miss clones

  #description
  :copy-command{cmd="jscpd . --max-gap-lines 2 --similarity 0.7"}

  Type-3: a copy with a few inserted or changed lines (`--max-gap-lines N`), or a JavaScript/TypeScript function with the same structure (`--similarity RATIO`, compared by syntax tree). Reported as `similar` with a score.

  <a href="/guides/clone-types#type-3-near-miss-clones" class="feature-card-link">
    Type-3 clones
    <span class="link-arrow">→</span>
  </a>
  :::

#default
  :::demo-video
  ---
  src: /video/clone-types.mp4
  poster: /video/clone-types-poster.jpg
  alt: One function drifting through the four clone kinds jscpd reports, exact, renamed, gap and similar, with the flag that finds each one
  caption: One function, four ways to copy it. Exact by default, renamed with --ignore-identifiers, an inserted line with --max-gap-lines 2, scattered edits with --similarity 0.7.
  ---
  :::
::

::u-page-section
---
id: how-teams-wire-it
---
#title
How teams wire it

#description
Four places, one binary. Each takes about a minute.

#features
  :::u-page-feature
  ---
  icon: i-lucide-git-commit-horizontal
  ---
  #title
  1. Pre-commit

  #description
  Block the commit before the clone lands.

  :copy-command{cmd="npx jscpd --threshold 3 ." caption=".husky/pre-commit"}

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

  :::u-page-feature
  ---
  icon: i-lucide-graduation-cap
  ---
  #title
  4. Agent skill

  #description
  Teach the agent the workflow, not just the tool: scan, refactor duplicates, remove dead code, simplify complex files, check the health score improved.

  :copy-command{cmd="npx skills add kucherenko/jscpd" caption="installs the jscpd, dry-refactoring and codebase-refactoring skills"}

  <a href="/getting-started/agent-skill" class="feature-card-link">
    Skills for Claude, Copilot, Gemini, Cursor
    <span class="link-arrow">→</span>
  </a>
  :::
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
Core

#description
Detection refined since 2013, now a native Rust engine

#features
  :::u-page-feature
  ---
  icon: i-lucide-award
  ---
  #title
  Since 2013

  #description
  A decade refining duplicate detection, now rewritten in Rust for native speed.

  <a href="/guides/how-detection-works" class="feature-card-link">
    How detection works
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-globe
  ---
  #title
  Speaks 224 languages

  #description
  JavaScript, Python, Java, Go, Rust, C++, TypeScript, Ruby... If you can write it, we can scan it.

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
  Blazingly fast™

  #description
  A Rust engine with parallel detection across format groups. A 159 MB codebase takes 3.4 seconds. No Node.js runtime, just one native binary.

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
  CLI first

  #description
  One command, everywhere: your laptop, CI/CD, that ancient Jenkins server nobody wants to touch.

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
  Reports you can show

  #description
  HTML, JSON, XML and README badges. Make technical debt visible (and slightly embarrassing).

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
  Thresholds and baselines

  #description
  Set a threshold and fail the build, or commit a baseline and fail only on clones added since.

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
  Cross-format detection

  #description
  Vue, Svelte, Astro and Markdown files are tokenized per block, so a `<script>` in a .vue file can match a .ts file. `--cross-formats "js-ts"` compares related formats in one pool, catching clones between .js and .ts.

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
  Git blame

  #description
  `--blame` shows who wrote each clone, from git history, so you know who to ask before you refactor.

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
  One of the most trusted tools in the ecosystem. Join the developers who rely on jscpd every day.

  <a href="https://www.npmjs.com/package/jscpd" class="feature-card-link">
    View on npm
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-graduation-cap
  ---
  #title
  Trusted in research

  #description
  54 papers, theses and patents use or cite jscpd: a measurement instrument in ACM TOSEM, two ICLR papers and an 832-million-line industrial dataset, a baseline for new detectors, a component of five patented systems.

  <a href="/research" class="feature-card-link">
    jscpd in research
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-newspaper
  ---
  #title
  Written about, not just installed

  #description
  54 verified blog posts, talks and case studies: real configs and numbers from teams wiring jscpd into CI gates, pre-commit hooks and AI agent loops.

  <a href="/articles" class="feature-card-link">
    jscpd in articles
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
  `uses: kucherenko/jscpd@v5` scans the repository, fails on threshold and uploads SARIF to Code Scanning. No install step.

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
  Works with the `pre-commit` framework, Husky or a plain shell hook in `.git/hooks`. Blocks the commit when duplication exceeds the threshold.

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
  The `codeclimate` reporter feeds GitLab Code Quality and `openmetrics` feeds its metrics reports, so duplication shows on the merge request.

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
  Embed detection in your own tools with the Rust crates (`cpd-finder`, `cpd-core`), or run the CLI and parse its JSON from any language.

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
  Trending repos, analyzed

  #description
  How much copy/paste ships in GitHub's trending repos? A daily pipeline runs jscpd on each and publishes the results.

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
Fresh from <span class="hero-gradient">GitHub Trending</span>

#description
Every day we run jscpd v5 over GitHub's trending repositories and publish how much copy/pasted code they ship: clone counts, duplication rates and the largest duplicated blocks.

#default
<TrendingPreview />
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
