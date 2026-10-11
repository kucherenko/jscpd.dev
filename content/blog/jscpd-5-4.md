---
title: What's new in jscpd 5.4 and 5.4.1
description: Similar functions by structure in 15 languages, clones of the files you are changing, jscpd inside the editor, and a progress number for a port. With commands and real output.
date: 2026-10-11
authors:
  - kucherenko
tags:
  - release
navigation: false
seo:
  title: What's new in jscpd 5.4 and 5.4.1
  description: jscpd 5.4.0 and 5.4.1 explained with examples, similar functions in 15 languages, --changed, the language server, --compare and the edn reporter.
---

Two releases in nine days, so one post for both. 5.4.0 added a language server and a way to compare two codebases, 5.4.1 rewrote `--similarity` from scratch and added `--changed`. Every example below runs on a demo folder from the [fixtures of the repository](https://github.com/kucherenko/jscpd/tree/master/fixtures), so you can repeat it on your machine.

## Functions that look alike, in 15 languages

A copied function rarely stays a copy. Someone renames the variables, changes a constant, adds a log line, and the token passes of jscpd lose it, they need a long run of tokens that repeats. `--similarity` is for this case. It compares whole functions by the structure of their syntax trees. jscpd normalizes every function first, the names of the functions it calls and its operators stay, local names, field names and literals become markers. Then two functions score the share of subtrees they have in common, 1.0 is the same structure, 0.8 is the default bar.

Up to 5.4.0 this worked for JavaScript and TypeScript only, by the sequence of node types, and the score was loose. Now it reads JavaScript, TypeScript, Python, Java, Kotlin, Scala, C#, Go, Rust, C, C++, PHP, Ruby, Swift and Clojure, plus the code blocks of Markdown files and the scripts of Vue, Svelte and Astro components.

Two Python functions, one prices a parcel, the other prices a policy. Every name and every literal differs, so the default run finds nothing, and the structure is the same:

```bash
jscpd fixtures/similarity-demo/renamed
# Found 0 clones.
jscpd fixtures/similarity-demo/renamed --similarity
# Clone found (python, similar (ast) ~1.00)
#  - insurance.py [1:1 - 8:26] (8 lines, 62 tokens)
#    shipping.py [1:1 - 8:29]
# Found 1 clones.
```

An edit costs a few points. `refunds.ts` is `orders.ts` with new names and one `trace(refund.id)` call added inside the loop, the pair scores 0.85:

```bash
jscpd fixtures/similarity-demo/edited --similarity
# Clone found (typescript, similar (ast) ~0.85)
#  - orders.ts [1:8 - 14:2] (14 lines, 121 tokens)
#    refunds.ts [1:8 - 15:2]
# Found 1 clones.
```

Called names count. Two functions with the same shape of statements that call different methods score 0.66, under the default, and show up only when you ask for 0.6:

```bash
jscpd fixtures/similarity-demo/calls --similarity
# Found 0 clones.
jscpd fixtures/similarity-demo/calls --similarity 0.6
# Clone found (python, similar (ast) ~0.66)
#  - accounts.py [1:1 - 8:19] (8 lines, 62 tokens)
#    devices.py [1:1 - 8:18]
# Found 1 clones.
```

The search is exact, it finds every pair at or above the ratio. An index of the fingerprints spares it comparing every function with every other one. On 100 open-source repositories it found the same 58,405 pairs as a brute-force run of the same method, in 65 seconds on one thread, the brute-force run took 498. Test files stay out, `--min-nodes` (20 by default) skips the tiny functions, and `--similarity 1` reports the functions with exactly the same structure.

Two things to know after the update. The scores differ from 5.4.0, so a threshold or a baseline set on the old scores needs a refresh. And there is a new reporter, `-r edn`, which writes every pair with its score and the size of both trees, most similar first:

```bash
jscpd fixtures/similarity-demo/renamed --similarity -r edn -o report
# {:candidates [
#  {:score 1.0
#   :language "python"
#   :left {:file "insurance.py", :start-line 1, :end-line 8}
#   :right {:file "shipping.py", :start-line 1, :end-line 8}
#   :left-nodes 112
#   :right-nodes 112}
# ]
#  :clones []}
```

The guide has the whole method, with a table of what one edit does to the score - [Similar functions](/guides/similarity).

## Only the clones of the files you changed

`--changed` takes the changed files from `git status`, scans everything, and reports a clone when one of its fragments is in a changed file. The first run saves the clones of HEAD to `.jscpd-baseline.json`, and a clone HEAD did not have is marked `[NEW]`. After a commit the baseline is built again on its own.

In a repository where `queue.js` is unchanged and a new `ring.js` copies its class:

```bash
jscpd --changed src --no-colors --no-tips
# Clone found (javascript) [NEW]
#  - queue.js [1:20 - 17:2] (17 lines, 112 tokens)
#    ring.js [1:19 - 17:2]
# Found 1 clones (1 new).
```

With `--fail-on-new-clones 0` this is a pre-commit gate that fails on the clone you are about to add and keeps quiet about the old ones. `--changed-only` scans the changed files alone, it is faster and sees only the clones between them. The hook setup is in the [pre-commit guide](/guides/pre-commit), and the demo repository is built step by step in [fixtures/changed-demo](https://github.com/kucherenko/jscpd/tree/master/fixtures/changed-demo).

## jscpd in the editor

`jscpd --lsp` starts jscpd as a language server. The editor sends the text as you type, after 300 ms of quiet the server tokenizes the file again from the buffer and searches its pool, and the findings come back as diagnostics that follow the text, saved or not. Clones are on by default, similar functions, semantic clones, dead code and complexity are switched on in the `lsp` section of `.jscpd.json` or from the editor settings.

This is what the demo project publishes for one file, printed through headless Neovim:

```text
4 jscpd/duplicate-code Duplicated in src/holds.js:4-13 (80 tokens)
13 jscpd/similar-function Same structure as the function at src/holds.js:13-20 (1.00)
22 jscpd/complex-function Complexity 20 in loanStatus, over the limit of 15
```

A clone comes with two code actions, go to the other copy, and ignore this clone, which wraps the fragment in `jscpd:ignore-start` and `jscpd:ignore-end`. There is a VS Code extension and a JetBrains plugin, both start the server for you and offer to download the binary when it is not on the PATH. Neovim, Helix, Sublime Text and Emacs need a few lines of config, they are in the [editors guide](/guides/editors).

## How far a port has come

`jscpd --compare source target` is for a port from one language to another, or for two implementations of one app. It pairs the functions of two folders with the semantic model and reports which functions of each side have a counterpart on the other. The demo is a billing module halfway through a port from Python to TypeScript:

```text
Code
 71% 5 of 7 functions in python have a counterpart in typescript
 80% 4 of 5 functions in typescript have a counterpart in python

Paired under other names (1):
  python                        typescript              similarity
  billing.py:28 tax_for_region  billing.ts:27 salesTax  0.87 high

Only in python (2):
  billing.py (1)
    46  due_date                6 lines
  shipping.py (1)
    18  estimate_delivery_days  8 lines

Only in typescript (1):
  billing.ts (1)
    39  toCurrency  8 lines
```

Tests and code are measured apart, a test pairs only with a test. `-r html` draws both sides as dependency graphs with the pairs bridging them. It needs the embedding model, `jscpd --semantic-download` gets it once, 548 MB. It is experimental. On the Java and Python versions of QR-Code-generator it paired 30 of 41 Java functions with no wrong pair. Two agent skills go with it, `compare-codebases` and `code-migration`, `npx skills add kucherenko/jscpd --skill code-migration` installs one. The details are in the [compare guide](/guides/compare).

## Smaller things

- `--report-name` sets the base name of the report files, so two runs into one folder no longer overwrite each other, and the GitHub Action takes it as `report-name`. Thank you [@MannXo](https://github.com/MannXo).
- The MCP server takes `kinds` in every tool and has `compare_folders`, see the [agents guide](/guides/agents).
- Pairs from `--similarity` have a SARIF rule of their own, `jscpd/similar-function`. GitHub code scanning matches alerts by rule, so the first upload after the update closes the old alerts and opens the same findings under the new rule.
- `--semantic` and `--compare` found functions named `if` in C, C++ and C#, a branch after `#if` was read as a function. Reported by [@MysterionRise](https://github.com/MysterionRise), fixed by [@mvanhorn](https://github.com/mvanhorn).
- `--dead-code` reported an import used only in a TSDoc `{@link}` as unused. The readers of a [DOU.ua thread](https://dou.ua/forums/topic/62369/) caught it.
- git commands run from a hook acted on the hook's repository, that is fixed, and an API key echoed in an embeddings error is redacted now.

## Update

```bash
curl -fsSL https://jscpd.dev/install.sh | bash
# or
npm i -g jscpd@5
```

The full list is in the [changelog](/project/changelog). Most of 5.4.1 started as issues from [@pygarap](https://github.com/pygarap), the structural `--similarity`, the `edn` reporter and `--changed` are his ideas. Thank you!
