import { createRequire } from "node:module";
import { dirname } from "node:path";

// @nuxt/content is a dependency of the docus layer, not of this project, so
// server routes here cannot import "@nuxt/content/server" directly under
// pnpm's strict layout. Resolve it through docus and expose it as an alias.
const require = createRequire(import.meta.url);
const docusDir = dirname(require.resolve("docus/package.json"));
const nuxtContentServer = require.resolve("@nuxt/content/server", { paths: [docusDir] });

export default defineNuxtConfig({
  extends: ["docus"],

  // docus provides its own app/pages layer; the project's pages/ dir is not
  // scanned, so register standalone (non-docs-layout) routes explicitly
  hooks: {
    "pages:extend"(pages) {
      pages.unshift(
        {
          name: "trending",
          path: "/trending",
          file: "~/pages/trending.vue",
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

  nitro: {
    alias: {
      "@nuxt/content/server": nuxtContentServer,
    },
    prerender: {
      routes: ["/404"],
    },
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
            "Copy/paste detector for programming source code. Rust-powered native binary, 24-37x faster. Supports 223+ languages.",
        },
        {
          name: "keywords",
          content:
            "jscpd, copy paste detector, code duplication, duplicate code, code quality, static analysis",
        },
        { property: "og:title", content: "jscpd - Copy/Paste Detector" },
        {
          property: "og:description",
          content: "Find duplicated code in 223+ programming languages — Rust-powered, 24-37x faster",
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
          content: "Find duplicated code in 223+ programming languages — Rust-powered, 24-37x faster",
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
    description: "Copy/paste detector for programming source code. Rust-powered, 24-37x faster.",
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
    description: "Copy/paste detector for programming source code. Rust-powered, 24-37x faster.",
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
