---
seo:
  title: jscpd - Copy/Paste Detector for Source Code
  description: jscpd finds duplicated code in 224 languages and fails the build when there is more of it than you allow. One native binary with a GitHub Action, pre-commit hooks, an MCP server for coding agents and a language server for editors.
  ogImage: https://jscpd.dev/og.png
---

::u-page-hero
---
orientation: horizontal
class: landing-hero
---
#title
Copy/Paste Detector for Source Code

#description
jscpd finds duplicated code in 224 languages and fails the build when there is more of it than you allow. One native binary, nothing else to install. Exact copies by default; renamed, near-miss and semantic clones when you ask for them.

#links
  :::u-button
  ---
  label: Get started
  to: /start/installation
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
  label: How detection works
  to: /concepts/how-detection-works
  color: neutral
  size: xl
  variant: ghost
  ---
  :::

#default
  :hero-install

  :::home-seo
  :::
::

::u-page-section
---
class: landing-explorer
---
#title
What <span class="hero-gradient">jscpd</span> does

#description
One binary, ten jobs. Each tab shows the command and what it prints on a demo fixture from the jscpd repository.

#default
  :feature-slides
::

::u-page-section
---
ui:
  features: "sm:grid-cols-2 lg:grid-cols-2"
---
#title
Four kinds of <span class="hero-gradient">clones</span>, one scan

#description
Exact copies are the default. The other three kinds are opt-in flags, and every clone comes with its kind and a similarity score.

#features
  :::u-page-feature
  ---
  icon: i-lucide-copy
  ---
  #title
  Exact clones

  #description
  :copy-command{cmd="jscpd ."}

  Type-1: identical tokens. Whitespace, layout and comments do not count. Every run reports these, starting from `--min-tokens 50` and `--min-lines 5`.

  <a href="/concepts/clone-types#type-1-exact-clones" class="feature-card-link">
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

  <a href="/concepts/clone-types#type-2-renamed-clones" class="feature-card-link">
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

  Type-3: a copy with a few inserted or changed lines (`--max-gap-lines N`), or a JavaScript, TypeScript or Python function with the same structure (`--similarity RATIO`, compared by syntax tree). Reported as `similar` with a score.

  <a href="/concepts/clone-types#type-3-near-miss-clones" class="feature-card-link">
    Type-3 clones
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-brain-circuit
  ---
  #title
  Semantic clones

  #description
  :copy-command{cmd="jscpd . --semantic"}

  Type-4: functions that do the same job with different code, even in another language, like a rule that a Rust backend enforces and a Svelte frontend repeats. A code embedding model compares them inside jscpd after a one-time `jscpd --semantic-download`. Experimental; reported as `semantic` with a score.

  <a href="/guides/semantic-clones" class="feature-card-link">
    Type-4 clones
    <span class="link-arrow">→</span>
  </a>
  :::

::

::u-page-section
---
id: where-it-runs
ui:
  features: "sm:grid-cols-2 lg:grid-cols-2"
---
#title
Where it runs

#description
Agents repeat helpers. Each diff reads fine on its own, so review misses it. A failing build does not. Four places for the same binary, each about a minute to set up.

#features
  :::u-page-feature
  ---
  icon: i-lucide-git-commit-horizontal
  ---
  #title
  Pre-commit

  #description
  Block the commit before the clone lands.

  :copy-command{cmd="npx jscpd --threshold 3 ." caption=".husky/pre-commit"}

  <a href="/guides/pre-commit" class="feature-card-link">
    pre-commit framework, Husky, plain git hook
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-workflow
  ---
  #title
  CI gate

  #description
  Fail the pull request when duplication crosses the line. SARIF goes to GitHub Code Scanning; GitLab gets Code Quality and metrics reports.

  ```yaml
  # .github/workflows/jscpd.yml
  - uses: kucherenko/jscpd@v5
    with:
      threshold: 3
  ```

  <a href="/guides/ci" class="feature-card-link">
    GitHub Action, GitLab CI, generic CI
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-bot
  ---
  #title
  Coding agents

  #description
  Give the agent the same detector over MCP, so it checks for clones before it writes more. Five skills teach it the whole loop: find duplicates, refactor them, remove dead code, check that the numbers improved.

  ```json
  // MCP client config
  { "mcpServers": { "jscpd": {
      "command": "jscpd", "args": ["--mcp", "."] } } }
  ```

  :copy-command{cmd="npx skills add kucherenko/jscpd" caption="skills for Claude, Copilot, Gemini and Cursor"}

  <a href="/guides/agents" class="feature-card-link">
    MCP server
    <span class="link-arrow">→</span>
  </a>
  <a href="/guides/agents" class="feature-card-link">
    Agent skills
    <span class="link-arrow">→</span>
  </a>
  :::

  :::u-page-feature
  ---
  icon: i-lucide-text-cursor-input
  ---
  #title
  Editors

  #description
  The same findings as diagnostics while you type, with "Go to the other copy" on every clone.

  ```lua
  -- init.lua, Neovim 0.11+
  vim.lsp.config('jscpd', { cmd = { 'jscpd', '--lsp' },
    root_markers = { '.jscpd.json', '.git' } })
  vim.lsp.enable('jscpd')
  ```

  <a href="/guides/editors" class="feature-card-link">
    Neovim, Helix, Sublime Text, Emacs, JetBrains
    <span class="link-arrow">→</span>
  </a>
  :::
::

::u-page-section
#title
Who uses <span class="hero-gradient">jscpd</span>

#description
From GitHub's official linter to enterprise codebases. [54 papers](/project/research) and [54 articles](/project/articles) describe how teams and researchers use it.

#default
  :who-uses{variant="compact"}
::

::u-page-section
#title
Beyond duplicates

#description
The same binary reports a [project health score and dashboard](/guides/dashboard), [dead code](/guides/dead-code) in JavaScript, TypeScript and Python, the [duplication trend over git history](/guides/history), [how far a port to another language has come](/guides/compare), and a [compact report for LLMs](/project/benchmarks/ai-token-efficiency). Each is one flag: `--dashboard`, `--dead-code`, `--history`, `--compare`, `--reporters ai`.

#links
  :::u-button
  ---
  label: All guides
  to: /guides
  color: neutral
  variant: subtle
  trailing-icon: i-lucide-arrow-right
  ---
  :::
::
