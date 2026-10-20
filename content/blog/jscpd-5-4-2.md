---
title: What's new in jscpd 5.4.2
description: Boundary rules that keep the code of a module inside it, renamed copies that pair a name with one name, the health score in --history, and Dockerfiles, Makefiles and 73 more formats. With commands and real output.
date: 2026-10-20
publishedAt: 2026-10-20T15:30:00Z
authors:
  - kucherenko
tags:
  - release
navigation: false
seo:
  title: What's new in jscpd 5.4.2
  description: jscpd 5.4.2 explained with examples, boundary rules for code that must stay in one module, consistent renaming in --ignore-identifiers and --similarity, health in --history, and built-in file names such as Dockerfile and go.mod.
---

5.4.2 adds boundary rules, makes the search for renamed copies strict about names, puts the health score into `--history` and knows 73 more formats. Every example below runs on a demo folder from the [fixtures of the repository](https://github.com/kucherenko/jscpd/tree/master/fixtures), so you can repeat it on your machine.

## Keep the code of a module inside it

Some code belongs in one place. In a shop that also gives loans, the backend calculates every amount it charges. A discount or a monthly payment that the web app calculates too is a second version of a backend function, and when the formula changes on the backend, the copy keeps the old one. Import linters such as dependency-cruiser or ArchUnit check who imports whom. A copied function imports nothing, so they don't see it.

A boundary rule in `.jscpd.json` names the code to protect and the places its copies must stay out of:

```json
{
  "boundaries": [
    {
      "name": "money",
      "code": ["backend/pricing", "backend/loans/Interest.kt#monthlyPayment"],
      "notIn": ["web/**"],
      "allow": ["web/e2e/**"],
      "thresholds": { "minTokens": 30, "similarity": 0.7 }
    }
  ]
}
```

`code` takes a folder, a file, a glob, or one method as `path#name`. `allow` lets the end-to-end tests keep their copy of the discount, and `thresholds` looks for smaller and looser copies than the clone report does, because for money code a missed copy costs more than a false alarm.

Every clone run checks the rules. The demo web app has three copies:

```bash
jscpd --config fixtures/boundaries-demo/.jscpd.json fixtures/boundaries-demo
# Boundaries:
# money: 3 copies outside the boundary
#   web/src/checkout/discount.ts:8-17 applyDiscount
#     copy of backend/pricing/discount.ts:6-15 applyDiscount (exact, 10 lines)
#   web/src/checkout/tax.ts:6-15 estimateTax
#     looks like backend/pricing/tax.ts:5-13 salesTax (similar (ast) ~0.84)
#   web/src/loan/payment.ts:4-14 monthlyPayment
#     looks like backend/loans/Interest.kt:8-15 monthlyPayment (semantic ~0.82)
# ERROR: jscpd found 3 copies of protected code outside their boundaries (money: 3)
```

jscpd found each copy a different way. The discount is copy-paste, a token clone. The tax has other names and a debug line, and the structure comparison of `--similarity` finds it. The monthly payment is the Kotlin method written again in TypeScript:

```kotlin
fun monthlyPayment(principalCents: Long, annualRatePercent: Double, months: Int): Long {
    if (months <= 0) return principalCents
    val monthlyRate = annualRatePercent / 100.0 / 12.0
    if (monthlyRate == 0.0) return principalCents / months
    val factor = (1 + monthlyRate).pow(months)
    val payment = principalCents * monthlyRate * factor / (factor - 1)
    return payment.roundToLong()
}
```

```ts
export function monthlyPayment(principal: number, yearlyRate: number, termMonths: number): number {
  if (termMonths <= 0) {
    return principal;
  }
  const r = yearlyRate / 100 / 12;
  if (r === 0) {
    return principal / termMonths;
  }
  const growth = Math.pow(1 + r, termMonths);
  return Math.round((principal * r * growth) / (growth - 1));
}
```

Tokens and syntax trees don't match across Kotlin and TypeScript, so the rules pair functions the way `--compare` does, with the embedding model of `--semantic`. `jscpd --semantic-download` gets it once, 548 MB. Without the model jscpd prints a warning and checks the rules without it, and here it finds the first two copies. A rule with `"disable": ["semantic"]` needs no model at all.

The run exits with code 1, so a rule is a CI gate as it is. The console, ai and json reporters show the violations. Baselines, `--changed`, SARIF, the language server and the MCP server don't know about the rules yet, they come next. The [boundaries guide](/guides/boundaries) has every key, the errors and warnings, and a CI job.

## Renamed copies that are really renamed

`--ignore-identifiers` used to turn every name into the same placeholder, so any name matched any other. These two functions came out as a clone:

```python
def compute(a, b, c):
    d = a + b * c
    e = d - a / b
    f = e * c + d
    ...

def evaluate(x, y, z):
    d = x + x * x
    e = d - x / x
    f = e * x + d
    ...
```

They have the same shape, and the data flows through them another way. [@soodoku](https://github.com/soodoku) opened [an issue](https://github.com/kucherenko/jscpd/issues/1217) about it, with numbers from Django and scikit-learn. I checked 24 projects in 11 languages: 6,942 of their 14,501 renamed clones had no one-to-one mapping between the names. Most of them were import lists, a list matched with itself shifted by a line, or statements that only look alike.

Now a name on one side has to stand for the same name on the other side every time, and two names can't stand for one:

```bash
jscpd fixtures/type2-demo/consistent/python --ignore-identifiers=blind
# Clone found (python, renamed)
#  - one.py [1:1 - 8:13] (8 lines, 54 tokens)
#    three.py [1:1 - 8:13]
# Clone found (python, renamed)
#  - one.py [1:1 - 8:13] (8 lines, 54 tokens)
#    two.py [1:1 - 8:13]
# Found 2 clones.
jscpd fixtures/type2-demo/consistent/python --ignore-identifiers
# Clone found (python, renamed)
#  - one.py [1:1 - 8:13] (8 lines, 54 tokens)
#    two.py [1:1 - 8:13]
# Found 1 clones.
```

`two.py` renames every name of `one.py` one for one, `three.py` is `evaluate` from above, and `=blind` is the old matching. A member is a name apart from a local of the same text, so a constructor that sets `this.url = url` still matches its copy that sets `this.url = address`: the field `url` stands for the field `url`, and the parameter `url` for `address`.

After the update `--ignore-identifiers` reports fewer renamed clones, and some of them are shorter, because jscpd cuts a clone where a name starts to stand for two. A baseline that 5.4 made with `--ignore-identifiers` holds the old clones. Keep `--ignore-identifiers=blind` with it or update it, otherwise `--fail-on-new-clones` counts the cut clones as new.

## The same rule in --similarity

`--similarity` had the same blind spot, every local name became one marker. Now the fingerprint of a subtree also records how its names repeat. Two functions from the demo:

```python
def clamp_low(values, floor):
    result = []
    for value in values:
        if value < floor:
            value = floor
        result.append(value)
    return result

def clamp_high(values, ceiling):
    result = []
    for value in values:
        if ceiling < value:
            value = ceiling
        result.append(value)
    return result
```

They are made of the same markers, but the comparison is mirrored, so `value` would stand for `ceiling` in the `if` and for `value` in the assignment. A renamed copy of `clamp_low` still scores 1.00, and `clamp_high` scores 0.74, under the default bar of 0.8:

```bash
jscpd fixtures/similarity-demo/names --similarity 0.7
# Clone found (python, similar (ast) ~0.74)
#  - clamp_high.py [1:1 - 7:18] (7 lines, 33 tokens)
#    clamp_low.py [1:1 - 7:18]
# Clone found (python, similar (ast) ~1.00)
#  - clamp_low.py [1:1 - 7:18] (7 lines, 33 tokens)
#    limit_low.py [1:1 - 7:16]
# Found 2 clones.
```

Fields, keyword arguments, object keys and types keep names of their own, so `self.url = url` still matches `self.url = link`. On the same 24 projects 15 of 23,530 pairs fell below 0.8, and runs take 2 to 9% longer. `--ignore-identifiers=blind` brings the old scores back.

## Health in --history

`--history` scans every commit of a range and prints the trend of duplication. Now every point also gets the health score that `jscpd --health` gives its tree, and a bare `--history` walks the last 30 commits of the branch. The demo repository has four commits: a function, two copies of it, and then an import instead of one copy:

```text
  #  COMMIT   DATE        FILES  LINES  CLONES  DUP LINES   DUP%  CHANGE  HEALTH  CHANGE  SUBJECT
  1  3ba9acb  2026-08-01      1     11       0          0   0.0%            74 B          initial helpers
  2  3ac98f6  2026-08-08      2     21       1         10  47.6%   +47.6    72 B      -2  copy total() into b.js
  3  5cec522  2026-08-15      3     31       2         20  64.5%   +16.9    70 B      -2  and again into c.js
  4  fe3f38a  2026-08-22      2     21       1         10  47.6%   -16.9    72 B      +2  b.js imports total() instead
  5  working  2026-10-20      2     21       1         10  47.6%       =    72 B       =  (uncommitted changes)
Trend: +47.6 points since 3ba9acb (2026-08-01)
Health: -2 since 3ba9acb (2026-08-01), 74 B → 72 B: duplication 75 → 72, dead code 72 → 68, complexity 75 → 75
```

Above the table jscpd draws two bar charts, one for duplication and one for health, and the `Health:` line says which dimension moved the score. `jscpd --health --history` and `jscpd --dashboard --history` print the badge or the dashboard first and the series under it, in the HTML report too. The walk follows first parents now, so a merged branch counts as its merge commit. The last 30 commits of axios take about 5.4 seconds, against 4.9 without the health score. The script that builds the demo repository is in [fixtures/history-demo](https://github.com/kucherenko/jscpd/tree/master/fixtures/history-demo), and the options are in the [history guide](/guides/history).

## Dockerfiles, Makefiles and 73 more formats

94 of 224 formats had no built-in extension, a gap jscpd carried over from v4, so `jscpd .` skipped Dockerfiles, Makefiles, `go.mod`, Elixir and Nix files unless you mapped them by hand. The new extensions come from GitHub Linguist, and a table of file names knows `Dockerfile`, `Containerfile`, `Makefile`, `go.mod`, `CMakeLists.txt`, `Gemfile`, `Jenkinsfile` and others:

```bash
jscpd fixtures/file-names-demo
# Clone found (elixir)
#  - lib/shop/invoice_totals.ex [4:3 - 20:4] (17 lines, 116 tokens)
#    lib/shop/refund_totals.ex [4:3 - 20:4]
# Clone found (docker)
#  - services/api/Dockerfile [1:1 - 13:9] (13 lines, 94 tokens)
#    services/worker/Dockerfile [1:1 - 13:9]
# Clone found (makefile)
#  - services/api/Makefile [3:1 - 21:22] (19 lines, 104 tokens)
#    services/worker/Makefile [3:1 - 21:22]
# Found 3 clones.
```

jscpd 5.4.1 prints `Found 0 clones.` for the same folder. So the numbers of an existing setup can move: on 22 repositories `jscpd .` picked up 1 to 5 more files each, mostly Dockerfiles, `.editorconfig`, `.jsonc`, Makefiles and `go.mod`. Check a `--threshold` gate after the update. A mapping of your own in `--formats-exts` or `--formats-names` still wins. Thanks to [@pygarap](https://github.com/pygarap) for [the issue](https://github.com/kucherenko/jscpd/issues/1174). The [supported formats](/reference/supported-formats) page lists every name and extension.

## Smaller things

- The MCP server's `check_duplication` matched no Vue, Svelte or Astro snippet, by tokens or by meaning. It splits a snippet into blocks now, the way a scan splits a file, and each match says its `format` and how many `lines` match.
- A Markdown page whose front matter ran into a code fence crashed jscpd with exit code 134, and took the MCP and language servers down with it.
- jscpd read a Razor view out of order, the HTML first and then the C#, so a clone across that seam ended before it started.
- `--history` failed when git's `log.showSignature` was on. [@vitorcsbrito](https://github.com/vitorcsbrito) reported it with an exact reproduction.
- `--compare` paired a function with every near-best lookalike, now a function keeps one counterpart. On Lucene and Lucene.NET the share of pairs between files of the same name went from 46% to 73%. The analysis and the numbers are from [@MysterionRise](https://github.com/MysterionRise).
- `--semantic` reported a page and the component it renders as a clone, a JSX element counts as a call now. Reported by [@Rosenblad](https://github.com/Rosenblad), fixed by [@cristianchiriac](https://github.com/cristianchiriac).
- The VS Code extension couldn't open a clone in a Markdown block, because the reports named it like `guide.md:markup`. They name the file now.
- Every repository counted the hook samples from `.git/hooks`, nine bash files and one perl file. jscpd skips `.git` now.

## Update

```bash
curl -fsSL https://jscpd.dev/install.sh | bash
# or
npm i -g jscpd@5
```

The full list is in the [changelog](/project/changelog) and in the [release notes](https://github.com/kucherenko/jscpd/releases/tag/v5.4.2). Thanks to everyone who sent an issue, a number or a fix for this release!
