<script setup lang="ts">
// The list of posts, newest first. Posts are content/blog/*.md in the `blog`
// collection (content.config.ts); one post renders through pages/blog-post.vue.
definePageMeta({ layout: 'default' })

const title = 'Blog'
const description = 'Release notes with commands and real output, and notes on how jscpd finds what it finds.'

useSeoMeta({
  title: 'jscpd blog',
  description,
  ogTitle: 'jscpd blog',
  ogDescription: description,
})
defineOgImage('Docs', { headline: 'jscpd', title, description })
useHead({
  link: [{ rel: 'alternate', type: 'application/atom+xml', title: 'jscpd blog', href: '/blog/feed.xml' }],
})

const { data: posts } = await useAsyncData('blog-posts', () => queryCollection('blog').order('date', 'DESC').all())
</script>

<template>
  <UContainer>
    <UPage>
    <UPageHeader :title="title" :description="description" headline="jscpd" />
    <UPageBody>
      <ul class="blog-list">
        <li v-for="post in posts" :key="post.path" class="blog-item">
          <time :datetime="post.date" class="blog-date">{{ formatPostDate(post.date) }}</time>
          <h2 class="blog-item-title">
            <NuxtLink :to="post.path">{{ post.title }}</NuxtLink>
          </h2>
          <p class="blog-item-description">{{ post.description }}</p>
          <BlogAuthors :ids="post.authors" compact />
        </li>
      </ul>
      <p class="blog-feed">
        New posts land in the <a href="/blog/feed.xml">Atom feed</a>.
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

.blog-date {
  display: block;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.375rem;
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
