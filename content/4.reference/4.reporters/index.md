---
title: Reporters
description: The 15 reporters of jscpd, what each one writes, and which to pick for a terminal, a script, a merge request widget or a README.
navigation:
  icon: i-lucide-file-chart-column
---

Every reporter ships inside the jscpd binary, so there is nothing to install. `-r` (`--reporters`) takes a comma-separated list, `console` is the default, and the reporters that write files put them in `--output`, which is `./report/` unless you change it. The console reporters print to stdout, so one run can print to the terminal and write any number of files.

## The reporters

| Reporter | Writes | Pick it when |
|---|---|---|
| `console` | the terminal | you read the result where you ran it: the clones, then a table per format (the default) |
| `console-full` (aliases `consoleFull`, `full`) | the terminal | you want the code of both copies under each clone; with `--blame` each line carries its author on both sides |
| `ai` | the terminal | an agent or an LLM reads the output: one line per clone and no code, about 79% fewer tokens than `console` |
| `xcode` | the terminal | a build log parser such as Xcode's turns `path:line:column: warning:` lines into warnings |
| `silent` | the terminal | you only want the one-line summary and the exit code |
| `threshold` | nothing | a v4 config lists it; `--threshold` runs the same check on its own |
| `json` | `jscpd-report.json` | a script reads the clones and the statistics |
| `xml` | `jscpd-report.xml` | a tool expects the PMD CPD XML format |
| `csv` | `jscpd-report.csv` | the per-format statistics go into a spreadsheet |
| `markdown` | `jscpd-report.md` | the statistics table goes into a pull request comment or a wiki page |
| `html` | `jscpd-report.html` | a person reads the report in a browser |
| `badge` | `jscpd-badge.svg`, `jscpd-lines-badge.svg` | a README shows the duplication |
| `sarif` | `jscpd-report.sarif` | GitHub code scanning or another SARIF consumer shows the clones on the diff |
| `codeclimate` (alias `gitlab`) | `gl-code-quality-report.json` | GitLab lists the clones in the Code Quality widget of a merge request (5.1.0+) |
| `openmetrics` | `jscpd-metrics.txt` | GitLab metrics reports or a Prometheus-style parser track the numbers (5.1.0+) |

jscpd 5 has no `time` reporter: the timing line prints on its own, and a `time` entry left over from a v4 config is accepted and ignored.

## Run it

```bash [Terminal]
jscpd . -r console,json,html --output report
```

The console part prints first, then one line per file:

```text
Found 3 clones.
JSON report saved to report/jscpd-report.json
HTML report saved to report/jscpd-report.html
time: 4.566ms
```

`--no-colors` drops the ANSI colors from the console reporters, which keeps a CI log readable. The same reporters in the config file:

```json [.jscpd.json]
{
  "reporters": ["console", "json", "html"],
  "output": "report"
}
```

## What the terminal shows

The `console` reporter prints one header per clone, the two locations as `[line:column - line:column]`, and a table per format. The header names the format and, when the clone is not an exact copy, its kind. On the `fixtures/mcp-demo` folder of the repository, with the flags that find renamed and near-miss clones:

```bash [Terminal]
jscpd . --ignore-identifiers --ignore-literals --max-gap-lines 1 -r console
```

```text
Clone found (javascript, similar (gap) ~0.95)
 - src/invoice.js [1:1 - 12:2] (12 lines, 197 tokens)
   src/print/invoice.js [1:1 - 13:2]
Clone found (javascript)
 - src/orders.js [1:1 - 12:2] (12 lines, 124 tokens)
   src/reports/orders.js [1:1 - 12:2]
Clone found (javascript, renamed)
 - src/returns.js [1:1 - 10:2] (10 lines, 104 tokens)
   src/shipping.js [1:1 - 10:2]
Found 3 clones.
time: 6.764ms
```

The table is shortened here: the real one has a row for every format in the scan, including the ones without clones (`bash`, `markdown` and `python` in this folder). `console-full` prints the same headers with the source lines of both copies underneath.

The `ai` reporter drops the table and the code and factors the common path prefix out of each pair. A renamed clone gets `(renamed)`, a near-miss clone its similarity and the mechanism that found it, a semantic clone `[~0.78 semantic]`:

```bash [Terminal]
jscpd . --ignore-identifiers --ignore-literals --max-gap-lines 1 -r ai
```

```text
Clones:
src/ invoice.js:1-12 ~ print/invoice.js:1-13 [~0.95 gap]
src/ orders.js:1-12 ~ reports/orders.js:1-12
src/ returns.js:1-10 ~ shipping.js:1-10 (renamed)
---
3 clones · 17.7% duplication
```

On the repository's `fixtures/` tree (132 files, 91 clones) this came to about 1,100 tokens against about 5,400 for `console`. [AI token efficiency](/project/benchmarks/ai-token-efficiency) has a second measurement on the larger benchmark corpus.

`xcode` prints one line per clone in the shape build tools parse, and `silent` prints the summary line only:

```text
src/invoice.js:1:0: warning: Found 11 lines (1-12) duplicated on file src/print/invoice.js (1-13)
src/orders.js:1:0: warning: Found 11 lines (1-12) duplicated on file src/reports/orders.js (1-12)
src/returns.js:1:0: warning: Found 9 lines (1-10) duplicated on file src/shipping.js (1-10)
Found 3 clones.
```

```text
Duplications detection: Found 3 exact clones with 25(13.02%) duplicated lines in 9 (4 formats) files.
```

## How kinds and gates show up

The [kind of a clone](/concepts/clone-types), a [baseline](/guides/baseline) and `--threshold` reach each format differently. The exit code is the same for all of them, and jscpd writes the files before the gates run, so a failing job still has its reports.

| Reporter | Kind of clone | New against a baseline | Over `--threshold` |
|---|---|---|---|
| `console`, `console-full` | in the header: `renamed`, `similar (gap) ~0.95`, `similar (ast) ~0.75`, `semantic ~0.78` | `[NEW]` after the header and `Found 3 clones (2 new).` | an `ERROR:` line, exit 1 |
| `ai` | `(renamed)`, `[~0.95 gap]`, `[~0.75 ast]`, `[~0.78 semantic]` | nothing | exit 1 |
| `json` | `kind`, `similarity`, `method` | `isNew` per clone, `newClones` and `newDuplicatedLines` in the statistics | nothing in the file, exit 1 |
| `sarif` | the rule id | level `error` | every result at level `error` |
| `codeclimate` | `check_name` | severity `major` | every issue at `major` |
| `openmetrics` | nothing | `jscpd_new_clones`, `jscpd_new_duplicated_lines` | nothing in the file |
| `html`, `xml`, `csv`, `markdown`, `badge`, `xcode`, `silent` | nothing | nothing | nothing in the file |

`--kind` narrows every reporter to the kinds you name, and the statistics follow the clones that are reported.

## Other modes

The modes beside clone detection reuse the reporter names and write files of their own:

| Mode | Reporters | Files |
|---|---|---|
| [`--compare`](/guides/compare) | `console`, `console-full`, `json`, `markdown`, `html` | `jscpd-compare.json`, `jscpd-compare.md`, `jscpd-compare.html` |
| [`--dashboard`](/guides/dashboard) | `console`, `json`, `badge`, `markdown`, `html` | `jscpd-dashboard.json`, `jscpd-dashboard.md`, `jscpd-dashboard.html`, `jscpd-health-badge.svg` |
| [`--health`](/concepts/health-score) | `console`, `ai`, `json`, `badge`, `markdown`, `html` | `jscpd-health.json`, `jscpd-health.md`, `jscpd-health.html`, `jscpd-health-badge.svg` |
| `--complexity` | `console`, `ai`, `json` | `jscpd-complexity.json` |

## Related

- [HTML](/reference/reporters/html), [JSON](/reference/reporters/json), [badge](/reference/reporters/badge), [SARIF](/reference/reporters/sarif), [CodeClimate](/reference/reporters/codeclimate) and [OpenMetrics](/reference/reporters/openmetrics) have a page each.
- [CLI options](/reference/cli) for `-r`, `-o` and every flag a reporter reads.
- [Exit codes](/reference/exit-codes) for what `--threshold`, `--exit-code` and `--fail-on-new-clones` do to a run.
- [CI](/guides/ci) for the workflows that collect these files.
