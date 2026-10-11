<script setup lang="ts">
// One post from the `blog` collection, at /blog/<slug> (registered in
// nuxt.config.ts, pages:extend). The body renders with the same prose
// components as the docs pages.
definePageMeta({ layout: 'default' })

const route = useRoute()
const { data: post } = await useAsyncData(`blog-post-${route.params.slug}`, () => queryCollection('blog').path(route.path).where('publishedAt', '<=', new Date().toISOString()).first())

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const title = post.value.seo?.title || post.value.title
const description = post.value.seo?.description || post.value.description

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'article',
  articlePublishedTime: `${post.value.date}T00:00:00Z`,
})
defineOgImage('Docs', { headline: 'Blog', title: title?.slice(0, 60), description })
useHead({
  link: [{ rel: 'alternate', type: 'application/atom+xml', title: 'jscpd blog', href: '/blog/feed.xml' }],
})

const headline = computed(() => `Blog · ${formatPostDate(post.value!.date)}`)

// llms.txt links the post's Markdown at /raw/<path>.md; prerender it like the docs pages do.
addPrerenderPath(`/raw${route.path}.md`)
const toc = computed(() => post.value?.body?.toc?.links || [])
</script>

<template>
  <UContainer>
    <UPage v-if="post">
    <UPageHeader
      :title="post.title"
      :description="post.description"
      :headline="headline"
    >
      <template #links>
        <BlogAuthors :ids="post.authors" />
      </template>
    </UPageHeader>

    <UPageBody>
      <ContentRenderer :value="post" />
      <ClientOnly>
        <BlogComments />
      </ClientOnly>
      <USeparator />
      <p class="blog-post-foot">
        <NuxtLink to="/blog">All posts</NuxtLink>
        <span aria-hidden="true">·</span>
        <a href="/blog/feed.xml">Atom feed</a>
        <span aria-hidden="true">·</span>
        <a :href="`https://github.com/kucherenko/jscpd.dev/edit/master/content/${post.stem}.${post.extension}`" target="_blank" rel="noopener">Edit this post</a>
      </p>
    </UPageBody>

    <template v-if="toc.length" #right>
      <!-- The docs layout folds the table of contents into a bar on small
           screens; this page has no such bar, so the list shows from lg up. -->
      <div class="hidden lg:block">
        <UContentToc :links="toc" title="On this page" highlight />
      </div>
    </template>
    </UPage>
  </UContainer>
</template>

<style scoped>
.blog-post-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}

.blog-post-foot a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.blog-post-foot a:hover {
  text-decoration: underline;
}
</style>
