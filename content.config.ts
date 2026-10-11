// Collections on top of the docus layer's. Nuxt Content merges the layers'
// content.config files by collection name, the project's last, so `docs`
// here replaces the layer's definition (the same one, with blog/ left out)
// and `blog` is new.
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // Copied from node_modules/docus/content.config.ts (the non-i18n branch,
    // no content/docs folder). The only change is the exclude of blog/**,
    // which keeps the posts out of the docs navigation, search sections,
    // prev/next links and the docs catch-all page.
    docs: defineCollection({
      type: 'page',
      source: {
        include: '**',
        prefix: '/',
        exclude: ['index.md', 'blog/**'],
      },
      schema: z.object({
        links: z.array(z.object({
          label: z.string(),
          icon: z.string(),
          to: z.string(),
          target: z.string().optional(),
        })).optional(),
      }),
    }),
    // Posts live in content/blog/<slug>.md and render through pages/blog.vue
    // (the list) and pages/blog-post.vue (one post); see data/authors.ts for
    // the author ids.
    blog: defineCollection({
      type: 'page',
      source: {
        include: 'blog/**',
        prefix: '/blog',
      },
      schema: z.object({
        date: z.string(),
        // ISO instant from which the post is listed, served and in the feed;
        // a rebuild after it (the daily deploy) makes it visible.
        publishedAt: z.string(),
        authors: z.array(z.string()),
        tags: z.array(z.string()).optional(),
      }),
    }),
  },
})
