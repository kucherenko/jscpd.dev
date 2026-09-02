<script setup lang="ts">
// Server-rendered 404 page. Prerendered at /404 and written as 404.html,
// the file Cloudflare Pages serves for unknown URLs (see nuxt.config.ts).
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Page not found',
  description: 'The page you were looking for does not exist.',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div class="not-found">
    <p class="not-found-code">404</p>
    <h1 class="not-found-title">
      Page <span class="hero-gradient">not found</span>
    </h1>
    <p class="not-found-text">
      The page you were looking for does not exist or has moved.
      It may have been renamed when the docs were reorganized for jscpd v5.
    </p>
    <div class="not-found-actions">
      <UButton to="/" color="primary" size="lg" icon="i-lucide-house" label="Go to homepage" />
      <UButton to="/getting-started/introduction" color="neutral" variant="outline" size="lg" icon="i-lucide-book-open" label="Read the docs" />
      <UButton to="https://github.com/kucherenko/jscpd/issues" target="_blank" color="neutral" variant="ghost" size="lg" icon="i-simple-icons-github" label="Report a broken link" />
    </div>
    <ul class="not-found-links">
      <li><NuxtLink to="/getting-started/installation">Installation</NuxtLink></li>
      <li><NuxtLink to="/getting-started/configuration">Configuration</NuxtLink></li>
      <li><NuxtLink to="/reporters">Reporters</NuxtLink></li>
      <li><NuxtLink to="/ci-and-hooks">CI &amp; hooks</NuxtLink></li>
      <li><NuxtLink to="/api">API</NuxtLink></li>
      <li><NuxtLink to="/getting-started/migration">Migrating from v4</NuxtLink></li>
    </ul>
  </div>
</template>

<style scoped>
.not-found {
  max-width: 44rem;
  margin: 0 auto;
  padding: 6rem 1.5rem 5rem;
  text-align: center;
}

.not-found-code {
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.875rem;
  letter-spacing: 0.2em;
  color: var(--ui-text-muted, #94a3b8);
  margin-bottom: 1rem;
}

.not-found-title {
  font-size: clamp(2.25rem, 6vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}

.not-found-text {
  font-size: 1.125rem;
  color: var(--ui-text-muted, #94a3b8);
  margin: 0 auto 2rem;
  max-width: 34rem;
}

.not-found-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 3rem;
}

.not-found-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.9375rem;
}

.not-found-links a {
  color: var(--ui-text-muted, #94a3b8);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.not-found-links a:hover {
  color: var(--ui-primary, #007bff);
  border-bottom-color: currentColor;
}
</style>
