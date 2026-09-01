export default defineNuxtConfig({
  extends: ["docus"],

  // docus provides its own app/pages layer; the project's pages/ dir is not
  // scanned, so register standalone (non-docs-layout) routes explicitly
  hooks: {
    "pages:extend"(pages) {
      pages.unshift({
        name: "trending",
        path: "/trending",
        file: "~/pages/trending.vue",
      });
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
        { name: "twitter:card", content: "summary_large_image" },
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

  llms: {
    domain: "https://jscpd.dev",
    title: "jscpd",
    description: "Copy/paste detector for programming source code. Rust-powered, 24-37x faster.",
  },
});
