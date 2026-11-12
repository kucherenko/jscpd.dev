---
title: What's new in jscpd 5.4.3
description: runJscpd() for Node.js scripts, both fragments of a clone in the HTML report, an Action that installs the jscpd of its own tag, and fixes for jscpd:ignore regions and dead-code findings. With commands and real output.
date: 2026-11-12
publishedAt: 2026-11-12T10:00:00Z
authors:
  - kucherenko
tags:
  - release
navigation: false
seo:
  title: What's new in jscpd 5.4.3
  description: "jscpd 5.4.3 explained with examples: runJscpd() from the npm package, a side-by-side HTML report with highlighting, Action version pinning, jscpd:ignore regions with /* in strings, and dead-code fixes for import() and constructors."
---

5.4.3 is a smaller release than 5.4.2. It adds a function for Node.js scripts, shows both sides of a clone in the HTML report, and fixes things people ran into in real projects: an Action that ignored the pinned version, ignore regions that leaked, and dead-code findings that weren't dead. Most of the fixes came from issues with a reproduction and the cause, and several came with the fix too.

## Run jscpd from a Node.js script

The npm package used to give you only the `jscpd` command. A script that wanted to run it started a second Node.js process with `npx jscpd`, and tools such as knip didn't see that the project uses jscpd. Now `require("jscpd")` and `import { runJscpd } from "jscpd"` give you `runJscpd(args, options)`. It finds the binary for the platform the same way the command does and returns what `spawnSync` returns:

```js
import { runJscpd } from "jscpd";

const { status, stderr } = runJscpd(
  [process.argv[2], "--min-tokens", "25", "--threshold", "10", "--silent"],
  { encoding: "utf8" }
);
if (status !== 0) {
  console.error(stderr.trim());
  process.exit(status);
}
console.log("duplication is under 10%");
```

```bash
node check.mjs src
# ERROR: jscpd found too many duplicates (50.0%) over threshold (10.0%)
```

Where the command prints an error and exits, for example on a platform without a prebuilt binary, the function throws an `Error` with the same message and `code === "JSCPD_NO_BINARY"`. The types are in `index.d.ts`. Detection still runs in the Rust binary only, so this is a way to start it, not the v4 `jscpd()` API. [@abrahamguo](https://github.com/abrahamguo) wrote it ([#1238](https://github.com/kucherenko/jscpd/pull/1238)), and the next release adds `getJscpdReport()` from the same author, which returns the parsed JSON report.

## Both sides of a clone in the HTML report

"Show code" in the HTML report opened only the first fragment, so to see what it was a copy of you went to the other file yourself. Now it opens both fragments side by side, or one above the other on a narrow screen. Each fragment sits under its file name with line numbers, and a long line scrolls inside its own pane. The report highlights the code with Prism again, as the v4 report did, and inlines only the languages it shows, so the file stays small: the report below is 27 KB.

```bash
jscpd --reporters html fixtures/file-names-demo
# HTML report saved to report/jscpd-report.html
```

[Open the report](/examples/html-report-demo.html){target="_blank"} of the file names demo: three clones, in Elixir, in a Dockerfile and in a Makefile. Thanks to [@crystalfp](https://github.com/crystalfp) for [the issue](https://github.com/kucherenko/jscpd/issues/1263).

## Pinning the Action pins jscpd

The `version` input of the GitHub Action defaulted to `latest`. So this workflow installed jscpd 5.4.2 the day 5.4.2 came out, even though it pins the Action to 5.4.1:

```yaml
- uses: kucherenko/jscpd@v5.4.1
  with:
    path: src
```

From v5.4.3 on, an empty `version` installs the release that the Action's own ref belongs to. Pin `kucherenko/jscpd@v5.4.3` or its commit SHA, and you get jscpd 5.4.3 until you move the pin, and a Dependabot bump of the Action updates both. `version: latest` still installs the newest release, and `@v5` keeps following the latest 5.x as before. Older tags can't learn this, so `@v5.4.1` still installs the newest jscpd. Reported by [@dannystaple](https://github.com/dannystaple), fixed by [@sarankumar1325](https://github.com/sarankumar1325) ([#1240](https://github.com/kucherenko/jscpd/issues/1240), [#1249](https://github.com/kucherenko/jscpd/pull/1249)).

## jscpd:ignore regions with `/*` in a string

Here is a list of routes between ignore markers, and a test fixture with the same list:

```ts
/* jscpd:ignore-start */
export const PROTECTED_ROUTES = [
  { path: "/api/auth/organization/*", roles: ["owner", "admin"], audit: true },
  { path: "/api/auth/members/*", roles: ["owner", "admin"], audit: true },
  { path: "/api/billing/invoices/*", roles: ["owner", "billing"], audit: true },
  { path: "/api/billing/cards/*", roles: ["owner", "billing"], audit: false },
];
/* jscpd:ignore-end */
```

jscpd 5.4.2 reported the region anyway:

```bash
jscpd --min-tokens 25 --min-lines 3 .
# Clone found (typescript)
#  - src/auth/routes.ts [3:37 - 7:3] (5 lines, 70 tokens)
#    test/routes.fixture.ts [2:37 - 6:3]
# Found 1 clones.
```

The JavaScript and TypeScript tokenizer looked for the markers with a byte scan that took every `/*` for the start of a comment, the one in `"/api/auth/organization/*"` too. That fake comment ran to the next `*/`, the one that closes `jscpd:ignore-end`, so the region ended at the first route. 5.4.3 finds the markers by their text, as the other languages do, and prints `Found 0 clones.` Markers inside template literals, such as the CSS of a styled component, work as before. [@bauchdj](https://github.com/bauchdj) found it in a data file of URL globs that gave 126 clones, and sent the cause; [@sarankumar1325](https://github.com/sarankumar1325) fixed it ([#1257](https://github.com/kucherenko/jscpd/issues/1257), [#1258](https://github.com/kucherenko/jscpd/pull/1258)).

## "Ignore this clone" in JSX

The language server's "Ignore this clone" action wrote `// jscpd:ignore-start` among JSX children, where the page renders it as text, and it could put a marker inside a tag, which TypeScript can't parse. Now it writes markers that JSX accepts and keeps them outside of tags:

```tsx
<ul>
  {/* jscpd:ignore-start */}
  <li>{order.id}</li>
  <li>{order.total}</li>
  {/* jscpd:ignore-end */}
</ul>
```

When the clone starts or ends inside a tag, the start marker goes before the tag and the end marker after it. Each copy of a `--cross-formats` clone gets the comment syntax of its own file, and the `<script lang="tsx">` of a Vue, Svelte or Astro component gets the JSX markers ([#1260](https://github.com/kucherenko/jscpd/pull/1260), [#1264](https://github.com/kucherenko/jscpd/pull/1264)).

## Dead code that wasn't dead

Three reports from [@abrahamguo](https://github.com/abrahamguo) came with the cause, and in this small project two of them show up at once:

```js
// src/main.js
import { Cart } from "./cart.js";

const cart = new Cart("EUR");
cart.add({ sku: "tea", price: 450 });

export async function openAdmin() {
  const { renderAdmin } = await import(`./admin/panel.js`);
  renderAdmin(document.body, cart);
}
```

```js
// src/cart.js
export class Cart {
  constructor(currency) {
    this.currency = currency;
    this.items = [];
  }

  add(item) {
    this.items.push(item);
  }
}
```

jscpd 5.4.2:

```bash
jscpd --dead-code --dead-code-categories all .
# Unused files (1)
#  - src/admin/panel.js  certain 95%  3 lines
# Unused members (1)
#  - method src/cart.js:2:3 Cart.constructor  medium 70%  4 lines
# Found 2 dead code findings in 3 files (31.8% of 22 lines).
```

jscpd 5.4.3 prints `No dead code found.` for the same project:

- `import()` with backticks and nothing interpolated, such as `` import(`./admin/panel.js`) ``, is followed now, and so is `` import.meta.glob(`./pages/*.ts`) ``. A quoted specifier with a `$` in it, such as SvelteKit's `import('$lib/x')`, is followed too: only `${` inside backticks counts as interpolation. Before, the importing file also lost 30 points of confidence on all its findings ([#1239](https://github.com/kucherenko/jscpd/issues/1239), [#1251](https://github.com/kucherenko/jscpd/pull/1251)).
- `constructor` in JavaScript and dunder methods such as `__init__` or `__repr__` in Python are called by the runtime, not by name, so the unused-member check skips them. Fixed by [@sarankumar1325](https://github.com/sarankumar1325) ([#1253](https://github.com/kucherenko/jscpd/issues/1253), [#1254](https://github.com/kucherenko/jscpd/pull/1254)).
- `knip.ts` and `knip.js` are knip's config, and a new framework entry keeps them as entry points instead of unused files ([#1255](https://github.com/kucherenko/jscpd/issues/1255), [#1256](https://github.com/kucherenko/jscpd/pull/1256)).

On six repositories that we checked with the `import()` fix, nothing new was reported.

## Security and packaging

- The Linux binaries accepted certificates from the leaked emSign intermediate CAs. rustls-webpki 0.103.16 and webpki-roots 1.0.10 reject them. This matters only for `--semantic-url` with a remote API on Linux: model downloads are pinned by SHA-256, and macOS and Windows use the system TLS stack (RUSTSEC-2026-0381, 0382, 0383).
- candle 0.11.1 brings zip 9.3.0, which fixes RUSTSEC-2026-0429 and three zip advisories, and askama no longer pulls in the unmaintained basic-toml.
- `nix run github:kucherenko/jscpd` builds again, and a Nix workflow builds and runs the package on Linux and macOS ([#1272](https://github.com/kucherenko/jscpd/pull/1272)).
- The npmmirror registry never copied `jscpd-linux-x64-gnu@5.4.2`, so pnpm installs through the mirror lost the Linux binary without a warning. The release pipeline asks the mirror to sync every package now. Reported by [@icret](https://github.com/icret) ([#1261](https://github.com/kucherenko/jscpd/issues/1261)).

## Update

```bash
curl -fsSL https://jscpd.dev/install.sh | bash
# or
npm i -g jscpd@5
```

The full list is in the [changelog](/project/changelog) and in the [release notes](https://github.com/kucherenko/jscpd/releases/tag/v5.4.3). Thanks to [@abrahamguo](https://github.com/abrahamguo), [@sarankumar1325](https://github.com/sarankumar1325), [@dannystaple](https://github.com/dannystaple), [@bauchdj](https://github.com/bauchdj), [@crystalfp](https://github.com/crystalfp) and [@icret](https://github.com/icret) for the issues, the causes and the fixes in this release!
