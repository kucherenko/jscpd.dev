---
title: What jscpd finds
description: What a default run reports, what jscpd finds when you ask for it, what it leaves alone, and where to go first.
navigation:
  icon: i-lucide-house
seo:
  title: What jscpd finds
  description: jscpd finds duplicated code in 224 formats, from exact copies to renamed, near-miss and semantic clones, and reports it in the terminal, in CI, in editors and to coding agents.
---

jscpd finds duplicated code in a repository and reports it in the terminal, in CI, in an editor or to a coding agent. It is for teams that want a duplication number to gate a build on, and the copies behind it.

## What a default run reports

Without options, jscpd reports exact copies: every block of at least 50 tokens and 5 lines that appears more than once (`--min-tokens`, `--min-lines`). It reads 224 formats and tokenizes each with that language's own comment and string rules, JavaScript and TypeScript through the oxc parser, so a clone is a repeated run of language tokens. A rolling Rabin-Karp hash over those tokens finds the repeats. Inside a git repository, files that `.gitignore` lists are skipped. [How detection works](/concepts/how-detection-works) follows a file through the pipeline; [Supported formats](/reference/supported-formats) lists the formats.

```bash [Terminal]
jscpd .
```

```text
Clone found (javascript)
 - generated/checkout.js [2:1 - 25:2] (24 lines, 179 tokens)
   src/checkout.js [1:1 - 24:2]
Clone found (javascript)
 - generated/checkout.js [2:1 - 25:2] (24 lines, 179 tokens)
   vendor/checkout.js [2:1 - 25:2]
Found 2 clones.
```

After the clones, the terminal prints one row per format and a total; for this run it is one row:

| Format | Files analyzed | Lines | Clones | Duplicated lines |
|---|--:|--:|--:|--:|
| `javascript` | 3 | 74 | 2 | 48 (64.86 %) |

The run is `fixtures/ignore-demo/glob` from the jscpd repository: one file copied into `vendor/` and `generated/`. Each clone names both places with line and column; the percentage is the duplication of the scan.

## What it finds when you ask

- Renamed copies, the same code under other variable, function or literal names: `--ignore-identifiers`, `--ignore-literals` and `--ignore-annotations`.
- Near-miss copies with a few inserted or edited lines: `--max-gap-lines`; and functions with the same structure in 15 languages: [`--similarity`](/guides/similarity).
- Semantic clones, functions that do the same job with different code, in one language or across languages: `--semantic`, experimental, with a code embedding model.

[Types of code clones](/concepts/clone-types) says where the lines between these sit and which flag turns each on.

## What it does not do

jscpd does not rewrite code: it reports, and the refactoring is yours or your agent's. A scan reads the paths you pass and makes no network call; there is no hosted service and no index of other repositories to compare against. The semantic mode is the exception: it downloads a 548 MB model once, or talks to an embeddings API you name. A default run reports exact clones only; the other kinds need their flags.

## Other questions jscpd answers

`--dashboard` and `--health` put duplication, dead code and complexity on one screen with a score ([dashboard](/guides/dashboard), [health score](/concepts/health-score)). `--dead-code` finds unused files, exports, symbols and imports in JavaScript, TypeScript and Python ([dead code](/guides/dead-code)). `--history` plots duplication over git history ([history](/guides/history)), and `--compare` measures a port or two implementations of one app ([compare](/guides/compare)). `--mcp` serves the detector to coding agents ([agents](/guides/agents)) and `--lsp` to editors ([editors](/guides/editors)).

## Where to go next

| You want to | Read |
|---|---|
| Install jscpd with your package manager or a one-line installer | [Installation](/start/installation) |
| Scan your repository and read the report, in about ten minutes | [Quickstart](/start/quickstart) |
| Fail a pull request when duplication grows | [Use jscpd in CI](/guides/ci) |
