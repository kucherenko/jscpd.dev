<script setup lang="ts">
// Comments under a post, through giscus: every post maps to a GitHub
// Discussion in kucherenko/jscpd.dev (category Announcements, found by the
// page's pathname), and a reader comments with a GitHub account. The
// giscus script loads in the browser only, lazily, and the theme follows
// the site's color mode. Ids come from the repository's GraphQL node ids.
const GISCUS = {
  repo: 'kucherenko/jscpd.dev',
  repoId: 'R_kgDOSYbv7w',
  category: 'Announcements',
  categoryId: 'DIC_kwDOSYbv784DHkL6',
}

const colorMode = useColorMode()
const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'))
const host = ref<HTMLElement | null>(null)

onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  const attributes: Record<string, string> = {
    'data-repo': GISCUS.repo,
    'data-repo-id': GISCUS.repoId,
    'data-category': GISCUS.category,
    'data-category-id': GISCUS.categoryId,
    'data-mapping': 'pathname',
    'data-strict': '1',
    'data-reactions-enabled': '1',
    'data-emit-metadata': '0',
    'data-input-position': 'top',
    'data-theme': theme.value,
    'data-lang': 'en',
    'data-loading': 'lazy',
  }
  for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value)
  host.value?.appendChild(script)
})

watch(theme, (value) => {
  const frame = host.value?.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme: value } } }, 'https://giscus.app')
})
</script>

<template>
  <section class="blog-comments" aria-labelledby="comments">
    <h2 id="comments" class="blog-comments-title">Comments</h2>
    <p class="blog-comments-note">
      Comments live in the <a :href="`https://github.com/${GISCUS.repo}/discussions`" target="_blank" rel="noopener">discussions of the site repository</a>, a GitHub account is all it takes.
    </p>
    <div ref="host" class="blog-comments-host" />
  </section>
</template>

<style scoped>
.blog-comments {
  margin-top: 2.5rem;
}

.blog-comments-title {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.blog-comments-note {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}

.blog-comments-note a {
  color: var(--jscpd-blue, #007bff);
}

.blog-comments-host {
  min-height: 12rem;
}
</style>
