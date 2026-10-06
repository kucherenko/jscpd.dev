---
title: Guides
description: One task per page, with the command, the output and the settings that matter.
navigation: false
seo:
  title: Guides
  description: How-to guides for jscpd, from a CI gate to dead code and semantic clones.
---

The reference pages say what a flag does; these pages say when to reach for it and what to do with the result.

| Guide | What it covers |
|-------|----------------|
| [Use jscpd in CI](/guides/ci) | A failing check on GitHub Actions, GitLab CI and any other runner, with SARIF, Code Quality and metrics reports |
| [Pre-commit hooks](/guides/pre-commit) | The pre-commit framework hook, Husky, and a plain git hook |
| [Fail only on new duplication](/guides/baseline) | A committed baseline or a git ref as the accepted state, so old clones do not fail the build |
| [Monorepos](/guides/monorepos) | Clones inside one package against clones across packages, with `--skip-local` and `--skip-isolated` |
| [Cross-format detection](/guides/cross-format) | Clones between JavaScript and TypeScript, and inside Vue, Svelte, Astro and Markdown files |
| [Agents](/guides/agents) | The MCP server, the agent skills and the `ai` reporter for Claude, Cursor, Copilot and others |
| [Editors](/guides/editors) | `jscpd --lsp` in Neovim, Helix, Sublime Text, Emacs and JetBrains IDEs |
| [Duplication over git history](/guides/history) | `--history`: one scan per commit, as a chart and a table (5.2.1+) |
| [Dashboard and health score](/guides/dashboard) | `--dashboard` and `--health`: one screen for a project, and one number for a README badge (5.3.0+) |
| [Dead code](/guides/dead-code) | `--dead-code`: unused files, exports, symbols and imports in JavaScript, TypeScript and Python, with confidence scores |
| [Comparing two codebases](/guides/compare) | `--compare`: how far a port has come, or two implementations of one app checked for parity (5.4.0+, experimental) |
| [Semantic clones](/guides/semantic-clones) | `--semantic`: functions that do the same job with different code, in one language or across two (5.3.3+, experimental) |
