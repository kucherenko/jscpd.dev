---
heist: playground
date: 2026-06-10
status: pending-review
---

# Reconnaissance Dossier: Playground

## Objective
Build an interactive playground on jscpd.dev where users paste a GitHub repo URL and see a jscpd duplication report. Deployed on Cloudflare Pages.

## Codebase Overview

- **Framework:** Nuxt 4 + Docus (documentation theme) — `extends: ["docus"]`
- **Build target:** Cloudflare Pages (`--preset=cloudflare_pages`)
- **Current deployment:** `npx wrangler pages deploy .output/public --project-name=jscpd` via GitHub Actions
- **Package manager:** pnpm (lockfile present), also has bun.lock
- **Key directories:**
  - `components/` — Vue components (ReporterToggle, PerfChart, ProductHuntBadge, app/*)
  - `content/` — Docus markdown content (getting-started, reporters, api)
  - `assets/` — CSS + client animation JS
  - `public/` — Static assets (logos, favicon)
  - `plugins/` — Empty
  - No `server/` directory, no `pages/` directory (Docus handles routing)
  - No API routes currently

- **jscpd package:** Not installed as a dependency. This is the marketing/docs site, not the jscpd library itself.

## Existing Test Coverage
- No test files found in the project.
- CI only runs `pnpm build` — no test step.

## Dependencies
| Dependency | Version | Notes |
|-----------|---------|-------|
| nuxt | ^4.4.8 | Nuxt 4 with Docus |
| docus | latest | Docs theme |
| @nuxt/a11y | 1.0.0-alpha.1 | Accessibility |
| @nuxt/fonts | 0.13.0 | Font optimization |
| @nuxt/hints | 1.0.0-alpha.5 | Build hints |
| better-sqlite3 | ^12.10.0 | SQLite — potential for server-side storage |
| agents | ^0.3.10 | AI agents library |

## Relevant Ledger Entries

### Applicable Insights
- (No ledger entries found — `docs/gangsta/` directory is new)

### Applicable Negative Constraints
- (None found)

## Risks and Unknowns

1. **jscpd execution on CF Pages:** CF Pages Functions have a 10MB limit on worker size and 50ms–30s CPU time limits. Running jscpd (a Rust binary) directly in a CF Worker is not feasible. Need an alternative approach:
   - **Option A:** Use a CF Worker + external compute (e.g., CF Durable Objects, separate API server) to clone the repo and run jscpd
   - **Option B:** Client-side approach — use jscpd's WASM build in the browser (if available)
   - **Option C:** Use GitHub API to fetch repo files, then run jscpd client-side or server-side
   - **Option D:** Use CF Pages Functions to proxy to an external jscpd API

2. **Repo cloning:** GitHub repos can be large. Need to handle rate limits, large repos, and timeout scenarios.

3. **jscpd Rust binary availability:** jscpd v5 is a Rust binary. It may not be callable from CF Workers directly. Need to verify if there's a WASM build or if we need a separate compute layer.

4. **Current site is static:** Built with `nuxt generate` (SSG). Adding a playground with dynamic behavior requires either:
   - Nuxt server routes (Nitro) — possible with CF Pages Functions
   - Or a fully client-side solution

5. **better-sqlite3 dependency:** Already present — could be used for caching reports server-side if we add Nitro routes.

## Recommended Scope

### Phase 1: Playground MVP
- Add a `/playground` page to jscpd.dev
- User inputs a GitHub repo URL
- Server-side (CF Pages Function): Clone the repo, run jscpd, return JSON report
- Client-side: Render the report with interactive visualization (duplicates, file tree, statistics)
- Handle errors: invalid URL, private repos, rate limits, timeout

### Key Decisions Needed from Don
1. **Compute strategy:** Should we run jscpd server-side on CF (requires a separate compute solution), or aim for a client-side approach?
2. **Report format:** Full HTML report, JSON API response, or both?
3. **Caching:** Cache results for previously scanned repos?
4. **Private repos:** Support them (requires GitHub auth)?

## Architecture Constraints
- CF Pages Functions run on V8 isolates (no native binaries)
- jscpd v5 is a Rust binary — cannot run directly in CF Workers
- Options: (a) Use jscpd v4 (Node.js) in CF Pages Functions, (b) Spin up a separate compute service, (c) Use WASM build