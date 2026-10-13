<script setup lang="ts">
// The list of posts, newest first. Posts are content/blog/*.md in the `blog`
// collection (content.config.ts); one post renders through pages/blog-post.vue.
import { loadPathViews, MIN_VIEWS_SHOWN, viewsLabel } from '~/composables/useSiteStats'

definePageMeta({ layout: 'default' })

const title = 'Blog'
const description = 'Release notes with commands and real output, and notes on how jscpd finds what it finds.'

const url = `${(useSiteConfig().url || 'https://jscpd.dev').replace(/\/+$/, '')}/blog`

useSeoMeta({
  title: 'jscpd blog',
  description,
  ogTitle: 'jscpd blog',
  ogDescription: description,
  ogUrl: url,
  twitterCard: 'summary_large_image',
  twitterTitle: 'jscpd blog',
  twitterDescription: description,
})
defineOgImage('Docs', { headline: 'jscpd', title, description })
useHead({
  link: [{ rel: 'alternate', type: 'application/atom+xml', title: 'jscpd blog', href: '/blog/feed.xml' }],
})

// Posts with a publishedAt in the future stay out until a build after it.
const { data: posts } = await useAsyncData('blog-posts', () => queryCollection('blog').where('publishedAt', '<=', new Date().toISOString()).order('date', 'DESC').all())

// All-time page views from Cloudflare Web Analytics (composables/useSiteStats.ts),
// shown once a post has MIN_VIEWS_SHOWN of them.
const { data: views } = await useAsyncData('blog-views', () => loadPathViews((posts.value ?? []).map(p => p.path)))
const shownViews = (path: string) => {
  const n = views.value?.[path] ?? 0
  return n >= MIN_VIEWS_SHOWN ? n : null
}
</script>

<template>
  <UContainer>
    <UPage>
    <UPageHeader :title="title" :description="description" headline="jscpd" />
    <UPageBody>
      <ul class="blog-list">
        <li v-for="post in posts" :key="post.path" class="blog-item">
          <p class="blog-meta">
            <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
            <template v-if="shownViews(post.path)">
              <span aria-hidden="true">·</span>
              <span>{{ viewsLabel(shownViews(post.path)!) }}</span>
            </template>
          </p>
          <h2 class="blog-item-title">
            <NuxtLink :to="post.path">{{ post.title }}</NuxtLink>
          </h2>
          <p class="blog-item-description">{{ post.description }}</p>
          <BlogAuthors :ids="post.authors" compact />
        </li>
      </ul>
      <p class="blog-feed">
        New posts land in the <a href="/blog/feed.xml">Atom feed</a>. The views next to a post, and the
        numbers for the whole site, are on the <NuxtLink to="/stats">statistics page</NuxtLink>.
      </p>
    </UPageBody>
    </UPage>
  </UContainer>
</template>

<style scoped>
.blog-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.blog-item {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
}

.blog-item:first-child {
  padding-top: 0;
}

.blog-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0 0 0.375rem;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
}

.blog-item-title {
  margin: 0 0 0.5rem;
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.blog-item-title a {
  color: var(--ui-text-highlighted, inherit);
  text-decoration: none;
}

.blog-item-title a:hover {
  color: var(--jscpd-blue, #007bff);
}

.blog-item-description {
  margin: 0 0 0.75rem;
  color: var(--ui-text-muted, #64748b);
  line-height: 1.6;
}

.blog-feed {
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}

.blog-feed a {
  color: var(--jscpd-blue, #007bff);
}
</style>
