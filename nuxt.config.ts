import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import trendingHistory from "./data/trending-history.json" with { type: "json" };
import trendingRepos from "./data/trending-repos.json" with { type: "json" };

// @nuxt/content is a dependency of the docus layer, not of this project, so
// server routes here cannot import "@nuxt/content/server" directly under
// pnpm's strict layout. Resolve it through docus and expose it as an alias.
const require = createRequire(import.meta.url);
const docusDir = dirname(require.resolve("docus/package.json"));
const nuxtContentServer = require.resolve("@nuxt/content/server", { paths: [docusDir] });

// /trending/<day>, /trending/week/<week> and /trending/<owner>/<repo> are
// dynamic routes; the static build needs the full list up front (data/ is
// refreshed by trending.yml). The latest day is served at /trending itself,
// but its dated URL is prerendered too: a /trending/<date> link shared on the
// day it was latest must not 404 until the next day's deploy.
const trendingRoutes = [
  ...trendingHistory.days.map((d) => `/trending/${d.date}`),
  ...trendingHistory.weeks.map((w) => `/trending/week/${w.week}`),
  ...trendingRepos.map((r) => `/trending/${r.name}`),
];

// The trending snapshots, per-repo and per-week files (data/trending/**)
// carry code excerpts. As plain JSON modules they go through Nitro's
// build-time text replacement (`typeof window` → `"undefined"`, same for
// document, navigator, location, XMLHttpRequest and process.env.NODE_ENV),
// which rewrites text inside string literals too: a snapshot whose excerpt
// contained `typeof window` became a broken chunk and six prerendered pages
// came out as 500. Shipping the files base64-encoded keeps every character
// of the data out of reach of such replacements; the page decodes on load.
const trendingDataDir = fileURLToPath(new URL("./data/trending/", import.meta.url));
const trendingDataBase64 = {
  name: "jscpd:trending-data-base64",
  enforce: "post" as const,
  async transform(_code: string, id: string) {
    const file = id.split("?")[0] ?? "";
    if (!file.startsWith(trendingDataDir) || !file.endsWith(".json")) return null;
    const base64 = (await readFile(file)).toString("base64");
    return {
      code: `export default JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(${JSON.stringify(base64)}), (c) => c.charCodeAt(0))));`,
      map: null,
    };
  },
};

export default defineNuxtConfig({
  extends: ["docus"],

  // docus provides its own app/pages layer; the project's pages/ dir is not
  // scanned, so register standalone (non-docs-layout) routes explicitly
  hooks: {
    "pages:extend"(pages) {
      // pages/ is also scanned, which turns pages/trending-repo.vue and
      // pages/trending-week.vue into stray /trending-repo and /trending-week
      // routes; only the parameterised registrations below should exist
      // (their names must differ, or vue-router keeps the scanned ones).
      for (const stray of ["/trending-repo", "/trending-week"]) {
        const scanned = pages.findIndex((p) => p.path === stray);
        if (scanned !== -1) pages.splice(scanned, 1);
      }
      pages.unshift(
        {
          name: "trending",
          path: "/trending",
          file: "~/pages/trending.vue",
        },
        {
          name: "trending-day",
          path: "/trending/:date(\\d{4}-\\d{2}-\\d{2})",
          file: "~/pages/trending.vue",
        },
        {
          // Static segments outrank params in vue-router, so this wins over
          // /trending/:owner/:repo for /trending/week/2026-W41.
          name: "trending-week",
          path: "/trending/week/:week(\\d{4}-W\\d{2})",
          file: "~/pages/trending-week.vue",
        },
        {
          name: "trending-repository",
          path: "/trending/:owner/:repo",
          file: "~/pages/trending-repo.vue",
        },
        {
          name: "support",
          path: "/support",
          file: "~/pages/support.vue",
        },
        {
          // pages/not-found.vue is also scanned as /not-found; the name must
          // differ or vue-router drops this record in favour of that one.
          name: "not-found-404",
          path: "/404",
          file: "~/pages/not-found.vue",
        },
      );
    },
    // Nuxt prerenders /404.html without SSR (an empty shell that renders
    // error.vue on the client). Cloudflare Pages serves that file for every
    // unknown URL, so crawlers and no-JS clients saw a blank page. The /404
    // page above is server-rendered to the same file name; skip the shell.
    "nitro:init"(nitro) {
      nitro.hooks.hook("prerender:generate", (route) => {
        if (route.route === "/404.html") {
          route.skip = true;
        }
      });
    },
  },

  // Old documentation URLs (the tree was reorganised in October 2026 into
  // Start / Guides / Concepts / Reference / Project). These rules serve
  // `nuxt dev`; production is a `nuxt generate` with the static preset,
  // which writes no _redirects, so public/_redirects carries the same list
  // and scripts/check-links.mjs keeps the two in step.
  routeRules: {
    "/getting-started/configuration": { redirect: { to: "/reference/config-file", statusCode: 301 } },
    "/getting-started/supported-formats": { redirect: { to: "/reference/supported-formats", statusCode: 301 } },
    "/getting-started/introduction": { redirect: { to: "/start", statusCode: 301 } },
    "/getting-started/installation": { redirect: { to: "/start/installation", statusCode: 301 } },
    "/getting-started/agent-skill": { redirect: { to: "/guides/agents", statusCode: 301 } },
    "/getting-started/changelog": { redirect: { to: "/project/changelog", statusCode: 301 } },
    "/getting-started/migration": { redirect: { to: "/project/migration", statusCode: 301 } },
    "/getting-started/v4": { redirect: { to: "/project/v4", statusCode: 301 } },
    "/guides/how-detection-works": { redirect: { to: "/concepts/how-detection-works", statusCode: 301 } },
    "/guides/clone-types": { redirect: { to: "/concepts/clone-types", statusCode: 301 } },
    "/guides/health": { redirect: { to: "/concepts/health-score", statusCode: 301 } },
    "/ci-and-hooks/pre-commit": { redirect: { to: "/guides/pre-commit", statusCode: 301 } },
    "/ci-and-hooks/ci": { redirect: { to: "/guides/ci", statusCode: 301 } },
    "/ci-and-hooks": { redirect: { to: "/guides/ci", statusCode: 301 } },
    "/reporters/openmetrics": { redirect: { to: "/reference/reporters/openmetrics", statusCode: 301 } },
    "/reporters/codeclimate": { redirect: { to: "/reference/reporters/codeclimate", statusCode: 301 } },
    "/reporters/sarif": { redirect: { to: "/reference/reporters/sarif", statusCode: 301 } },
    "/reporters/badge": { redirect: { to: "/reference/reporters/badge", statusCode: 301 } },
    "/reporters/json": { redirect: { to: "/reference/reporters/json", statusCode: 301 } },
    "/reporters/html": { redirect: { to: "/reference/reporters/html", statusCode: 301 } },
    "/reporters": { redirect: { to: "/reference/reporters", statusCode: 301 } },
    "/benchmarks/embedding-models": { redirect: { to: "/project/benchmarks/embedding-models", statusCode: 301 } },
    "/benchmarks/ai-token-efficiency": { redirect: { to: "/project/benchmarks/ai-token-efficiency", statusCode: 301 } },
    "/benchmarks/cross-format": { redirect: { to: "/project/benchmarks/cross-format", statusCode: 301 } },
    "/benchmarks/detection-speed": { redirect: { to: "/project/benchmarks/detection-speed", statusCode: 301 } },
    "/benchmarks": { redirect: { to: "/project/benchmarks", statusCode: 301 } },
    "/api/mcp-server": { redirect: { to: "/guides/agents", statusCode: 301 } },
    "/api/core": { redirect: { to: "/reference/rust-crates", statusCode: 301 } },
    "/api": { redirect: { to: "/reference/rust-crates", statusCode: 301 } },
    "/research": { redirect: { to: "/project/research", statusCode: 301 } },
    "/articles": { redirect: { to: "/project/articles", statusCode: 301 } },
    "/getting-started": { redirect: { to: "/start", statusCode: 301 } },
  },

  nitro: {
    alias: {
      "@nuxt/content/server": nuxtContentServer,
    },
    prerender: {
      // /health-corpus.json publishes the calibration corpus for the jscpd
      // repo's rust/scripts/calibrate-health.mjs; see server/routes/
      // health-corpus.json.ts.
      routes: ["/404", "/health-corpus.json", "/trending/code-only.jscpd.json", ...trendingRoutes],
    },
  },

  vite: {
    plugins: [trendingDataBase64],
  },

  css: ["~/assets/css/main.css"],

  // Add client-side animation script
  plugins: [{ src: "~/assets/js/animations.client.ts", mode: "client" }],

  app: {
    head: {
      title: "jscpd - Copy/Paste Detector",
      meta: [
        {
          name: "description",
          content:
            "Copy/paste detector for programming source code. Rust engine, self-contained binary, no Node.js runtime required. Supports 224 languages.",
        },
        {
          name: "keywords",
          content:
            "jscpd, copy paste detector, code duplication, duplicate code, code quality, static analysis",
        },
        { property: "og:title", content: "jscpd - Copy/Paste Detector" },
        {
          property: "og:description",
          content: "Find duplicated code in 224 programming languages — Rust engine, self-contained binary, no Node.js runtime required",
        },
        { property: "og:url", content: "https://jscpd.dev" },
        { property: "og:type", content: "website" },
        // Static social card: nuxt-og-image's generated /_og/ URLs are not
        // served under `nuxt generate`, so every page shares this one image.
        { property: "og:image", content: "https://jscpd.dev/og.png" },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "jscpd - Copy/Paste Detector for Source Code" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: "https://jscpd.dev/og.png" },
        { name: "twitter:title", content: "jscpd - Copy/Paste Detector" },
        {
          name: "twitter:description",
          content: "Find duplicated code in 224 programming languages — Rust engine, self-contained binary, no Node.js runtime required",
        },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/favicon.svg" },
      ],
    },
  },

  site: {
    url: "https://jscpd.dev",
    name: "jscpd",
    description: "Copy/paste detector for programming source code. Rust engine, self-contained binary, no Node.js runtime required.",
  },

  // The docus layer enables nuxt-og-image in zero-runtime mode, but the
  // images it links are not part of the static output — use public/og.png
  // (declared in app.head above) instead.
  ogImage: {
    enabled: false,
  },

  llms: {
    domain: "https://jscpd.dev",
    title: "jscpd",
    description: "Copy/paste detector for programming source code. Rust engine, self-contained binary, no Node.js runtime required.",
    // Non-content routes (registered in pages:extend above) are invisible to
    // Nuxt Content, so list them here explicitly.
    sections: [
      {
        title: "Project",
        links: [
          {
            title: "Support jscpd",
            href: "https://jscpd.dev/support",
            description: "How to support jscpd development: Open Collective, GitHub Sponsors, and crypto.",
          },
        ],
      },
    ],
  },
});
