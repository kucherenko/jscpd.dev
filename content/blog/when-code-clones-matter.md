---
title: "Two AI agents ported fs-extra to Rust. The tests can't tell which one is a copy"
description: Two AI agents ported fs-extra to Rust and both pass its tests. One rewrote the code, the other copied 32 of 51 functions into its JavaScript layer. How jscpd --compare tells them apart, and why a clone is the best progress report a migration has.
date: 2026-10-14
publishedAt: 2026-10-14T08:00:00Z
authors:
  - kucherenko
tags:
  - migration
  - compare
navigation: false
seo:
  title: "When code clones matter: catching an AI port that copied its source"
  description: An experiment with two AI agents porting fs-extra to Rust, with and without the jscpd code-migration skill. Tests, jscpd --compare reports, a benchmark and the cost of each run.
---

Two AI agents ported fs-extra, the Node.js file system library, to Rust. Both ports pass 488 of the 491 tests from fs-extra's own suite. Both export all 149 names of its API, with the right types.

One of them ported 50 of fs-extra's 51 functions, 34 into Rust and 16 into thin JavaScript wrappers over a Rust core. The other copied 32 of them, unchanged, into its own JavaScript layer and wrapped a little Rust around the rest.

The tests can't tell these two ports apart. A code clone detector can, and that is the case I want to make here: duplication is usually something you clean up, but during a migration it is the most honest progress report you have.

Agent-made ports are already shipping. Jarred Sumner [took Bun](https://bun.com/blog/bun-in-rust), 535,496 lines of Zig without comments, to Rust in 11 days with Claude Code. Stephen Toub [ported the GitHub Copilot runtime](https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/), about 430,000 lines of production TypeScript, to Rust with Copilot itself. Both write-ups record the agents cutting corners. In the Bun port, Claude read "let's get all the crates to compile" as "stub out the functions with compilation errors". The Copilot write-up mentions a port that "omitted SDK callbacks and deleted their end-to-end test". Toub tracks the port's progress with charts of the production TypeScript left and of the temporary N-API layer between the two languages, which peaked at 2,019 internal exports. A clone detector measures one level deeper. For every function in the source, it shows where its counterpart is.

## The experiment

I maintain [jscpd](https://github.com/kucherenko/jscpd), a copy-paste detector. Its latest release added `jscpd --compare`, which matches the functions of two codebases, and the repository ships a skill for coding agents, `code-migration`, that uses it to drive a port. I wanted to know whether the skill changes what an agent produces, so I gave the same task to the same agent twice.

The agent was [pi](https://github.com/earendil-works/pi) 0.99.1 running GLM-5.3-flash through ollama. The task, word for word in both runs, was to port fs-extra 11.4.1 to Rust as a native addon built with napi-rs, as a drop-in replacement with the same API, behavior and errors. fs-extra's test suite had to pass against the port, the port had to be faster, and the agent had to work without asking questions.

The two numbers at the top count different things. Of the 149 names fs-extra exports, 104 are Node's own `fs` methods passed through, and 45 are fs-extra's own API, which is 27 functions under several names (`mkdirs`, `mkdirp` and `ensureDir` are one function). The 51 are the functions in fs-extra's `lib/` folder, internal helpers included, that reach the minimum `--compare` counts, 30 tokens and 5 lines. The folder has 72 in all.

I'll call the two runs by the names their code now has on GitHub:

- **fs-extra-rs** got two skills from the jscpd repository, `code-migration` and `compare-codebases`, and one extra line in the prompt: "Use the code-migration skill for this port."
- **fs-extra-rs-plain** got nothing extra.

Both ran at the same time on one M1 laptop. This was the second round of the experiment. The first round ended the same way, and I'll come back to it.

fs-extra-rs was done in 123 minutes. fs-extra-rs-plain had its tests green after about an hour and then spent most of the next two running its own benchmark, until it hit the three-hour limit I had set per session.

## Why the tests didn't notice

Tests check behavior, and copied code behaves exactly like the code it was copied from. A port that keeps the source's JavaScript is guaranteed to pass the source's tests. It is the one thing about it you can count on.

fs-extra's suite even rewards copying. Six of its test files replace parts of fs-extra's internals with stubs, through proxyquire or a mocked `fs.rename`, and those tests only work if the JavaScript internals exist. The agent behind fs-extra-rs-plain kept the internals, changed no test, and got 745 passing tests. fs-extra-rs has no JavaScript internals to stub, so its agent rewrote five of those files to cause real failures instead: an `EACCES` from a directory with mode `000`, and real moves between two file systems where the originals mocked one. fs-extra-rs ended with 734 passing and 11 skipped.

Those numbers are each agent's own run of fs-extra's whole suite, 753 tests in 80 files before the agents touched them. Seventeen of those files load fs-extra's private modules directly or through proxyquire, so with the entry point swapped they would still test the original JavaScript. The comparison below counts the other 63 files, 491 tests.

To take the agents' own test changes out of the picture, I also ran fs-extra's unmodified tests against both ports, swapping fs-extra's entry point for the port. Both ports gave the same result, 488 of 491 passing and 2 skipped, and the same single test failed in both, because both export `fs.realpath.native` and fs-extra doesn't.

So "all tests green" was true for both, and it said nothing about how much porting had happened.

## A clone that means something

Most of the time a clone detector looks for copy-paste so you can fold it into one function. A migration flips that. The source is supposed to reappear in the target, only in another language. If `move()` from `move.js` shows up as `move_impl` in `move.rs`, that is progress. If `move()` shows up as `move()` in the target's `lib/move/move.js`, nothing moved.

A classic token-based detector, which is what jscpd has always been, only sees the second kind, because a JavaScript function and its Rust port share almost no tokens. To see both kinds, you have to compare what functions do rather than how they are spelled.

## How `jscpd --compare` works

```bash
npx jscpd --semantic-download   # once: the CodeRankEmbed model, 548 MB
npx jscpd --compare node-fs-extra/lib rust-fs-extra --ignore "**/target/**,**/node_modules/**"
```

The source goes first and the target second. Then:

1. **Find functions.** jscpd parses both folders and extracts every function from 19 languages, Rust and JavaScript among them. Functions under 30 tokens or 5 lines don't count toward the totals, because short functions resemble too many others.
2. **Embed them.** Each function becomes a vector from CodeRankEmbed, a code embedding model that runs locally inside jscpd. Two functions that do the same job point in the same direction even when language, names and structure differ. The vectors are cached, so the next run only embeds what changed and takes seconds.
3. **Pair by code.** Two functions pair when each is the other's closest match in the other folder, their cosine similarity clears the model's threshold (0.4125 across languages, 0.6375 within one language), and the match stands out from the runner-up.
4. **Pair by name.** A function left over can pair with one of the same name, ignoring case and underscores (`moveSync` and `move_sync`), if the similarity reaches 0.5625 and both live in modules the first step already linked. This catches short ports without pairing every `init` with every other `init`.
5. **Report.** Each pair gets a level, `high`, `medium` or `low`, and the report lists what pairs with what, what is left only in the source, and what exists only in the target. Tests are measured separately and only pair with tests. The JSON report also has `readyToPort`, the unported functions whose callees are all ported already, in the order to take them.

## What the two reports said

Here is part of the report for fs-extra-rs-plain, the port made without the skill:

```text
 80% 41 of 51 functions in node-fs-extra/lib have a counterpart in rust-fs-extra

  file                     paired  similarity   counterpart
  ensure/link.js           2 / 2   1.00         lib/ensure/link.js
  ensure/symlink-paths.js  2 / 2   1.00         lib/ensure/symlink-paths.js
  move/move.js             3 / 3   1.00         lib/move/move.js
  move/move-sync.js        5 / 5   0.94         lib/move/move-sync.js
  util/stat.js             7 / 7   0.90         lib/util/stat.js
```

Look at the counterpart column. `move.js` pairs with `lib/move/move.js` in the port at a similarity of 1.00, the same function in the same language. That is not a port. It is the original.

And part of the report for fs-extra-rs:

```text
 98% 50 of 51 functions in node-fs-extra/lib have a counterpart in rust-fs-extra

  file                     paired   similarity  counterpart
  copy/copy-sync.js        10 / 10  0.83        src/copy_sync.rs
  move/move.js             3 / 3    0.85        src/move_mod.rs
  move/move-sync.js        5 / 5    0.85        src/move_sync.rs
  util/stat.js             7 / 7    0.81        src/util_stat.rs
```

Same files, counterparts in `.rs`, similarities around 0.8, which is what a faithful port into another language looks like.

Sorting all 51 functions by where their counterpart lives:

| fs-extra's 51 functions | fs-extra-rs (with the skill) | fs-extra-rs-plain (without) |
|---|---|---|
| Counterpart in Rust | 34 | 4 |
| Copied unchanged into the port's JavaScript | 0 | 32 |
| Counterpart is a JavaScript wrapper that calls Rust | 16 | 5 |
| No counterpart | 1 | 10 |

The 16 JavaScript pairs in fs-extra-rs are thin files that keep fs-extra's module layout. Each function calls the native core and turns its error into Node's format. Their similarity sits between 0.69 and 0.91, never near 1.00. Its one unpaired function, `asyncIteratorConcurrentProcess`, has nothing to do in the port, because the Rust `copy` walks directories on its own threads. The agent noted that decision rather than writing a stub to raise the number.

## The copy shows up in the benchmark too

I benchmarked both ports against the original fs-extra on the same laptop: 30 scenarios, each library in its own process, three rounds with the order rotated, medians with bootstrap confidence intervals.

| 30 scenarios | fs-extra-rs (with the skill) | fs-extra-rs-plain (without) |
|---|---|---|
| Faster than fs-extra | 17 | 12 |
| Same speed (the confidence interval includes ×1.00) | 6 | 12 |
| Slower than fs-extra | 7 | 6 |
| Geometric mean speedup, without whole-file copies | ×1.12 | ×0.98 |

I leave whole-file copies out of the mean because on macOS both ports hand them to the file system's clone call, and a "speedup" of 5 to 260 times is a fact about APFS. The three whole-file copy scenarios are among the faster ones in both columns.

Where fs-extra-rs-plain kept fs-extra's JavaScript, it runs at fs-extra's speed, as the same code should. `move` comes out at ×1.00 against ×1.65 in fs-extra-rs, async `ensureFile` at ×0.99 against ×1.29, `ensureSymlinkSync` at ×1.00 against ×1.07. fs-extra-rs isn't faster everywhere, though. Its async `remove` is ×0.74 and its async `copy` of 2,000 small files ×0.87, so a real native port can still lose to Node's own thread pool. The benchmark measures the port; `--compare` tells you whether there is one.

## The percentage alone can lie

In this round the headline numbers point the right way, 98% for fs-extra-rs and 80% for fs-extra-rs-plain. In the first round they didn't. The run without the skill scored 84% and the run with it scored 73%, because the headline number counts a copy as a counterpart, and the copy-heavy port had more counterparts. That run had copied 37 functions. Its own summary called the result "a drop-in Rust port of fs-extra 11.4.1" with "~2,600 lines of Rust".

The fix is to look at where each counterpart lives. In a port to another language, a pair whose target is in the source's language with a similarity near 1.00 is a copy. The JSON report has everything needed to count them:

```bash
npx jscpd --compare node-fs-extra/lib rust-fs-extra -r json -o report --silent
node -e '
const r = require("./report/jscpd-compare.json")
const copies = r.code.pairs.filter(p => !p.b.file.endsWith(".rs") && p.similarity >= 0.97)
console.log(new Set(copies.map(p => p.a.file + ":" + p.a.name)).size, "functions paired with an unchanged copy")
'
```

On the four ports from both rounds it prints 0 and 3 for the runs with the skill, 32 and 37 for the runs without. jscpd doesn't flag these pairs on its own yet, and `--semantic-scope cross`, which keeps only the pairs across languages, doesn't change what `--compare` counts. It would help if it did.

## How the skill turns the report into a plan

The report on its own is a measurement. The `code-migration` skill makes it the loop the agent works in:

1. Run `--compare` on the source and an empty target to list every function to port.
2. Collect test coverage of the source and map each test to the functions it runs, so every function is ported together with the tests that check it.
3. Port the tests first, keeping inputs and expected values as they are. No stubs to make them compile, because a stub with the source's name can pair by name and count as done.
4. Port the code one function at a time, starting from `readyToPort`, and rerun `--compare` after each step to see the function leave the unmatched list and pair with the right thing.

The agent behind fs-extra-rs followed it almost to the letter. It ran `--compare` 11 times, and all 11 runs together took under two minutes thanks to the vector cache. The agent behind fs-extra-rs-plain never ran it, and never had a reason to look at what it had kept.

The first round also found a bug in the skill. The agent with the skill vendored its Rust dependencies into the target folder, about two thousand files of tokio, libc and syn, then ran `--compare` without `--ignore`. jscpd dutifully embedded every function of every crate, and the agent spent 36 minutes waiting on it. The skill now tells the agent to keep vendored code and build output out of both paths, through a `.gitignore` (which jscpd reads only inside a git repository) or through `--ignore`. In the second round the agent wrote the `.gitignore` the skill suggests and never hit the problem.

## What it cost

| | fs-extra-rs (with the skill) | fs-extra-rs-plain (without) |
|---|---|---|
| Time | 123 min | 180 min, stopped by the time limit |
| Model calls | 503 | 342 |
| Input tokens, not cached | 952 thousand | 2.6 million |
| Output tokens | 348 thousand | 350 thousand |
| Input tokens read from cache | 141 million | 111 million |

I wouldn't read a verdict into these numbers. The run without the skill in the first round took 76 minutes; this one took 180, almost all of the difference in its own benchmark, which ran three times for over 20 minutes each. Each of those pauses outlived the prompt cache, so the next model call read the whole context, about half a million tokens, uncached. That alone accounts for most of fs-extra-rs-plain's uncached input. Between two runs of the same agent with the same prompt, the spread in time was bigger than any effect of the skill.

What the skill reliably changed was the result. In both rounds, the run with it produced a port, and the run without it produced fs-extra with a native addon attached.

## Try it

```bash
npx jscpd --compare path/to/source path/to/target
```

- The port made with the skill is on npm as [@jscpd/fs-extra](https://www.npmjs.com/package/@jscpd/fs-extra), with the code at [kucherenko/fs-extra-rs](https://github.com/kucherenko/fs-extra-rs). It is experimental, and only checked as described here.
- The port made without the skill is kept for comparison at [kucherenko/fs-extra-rs-plain](https://github.com/kucherenko/fs-extra-rs-plain).
- The skills are in the [jscpd repository](https://github.com/kucherenko/jscpd/tree/master/skills).

If you run an agent on a migration, have it run `--compare` after every green test run, and read the counterpart column yourself before you believe the summary.
