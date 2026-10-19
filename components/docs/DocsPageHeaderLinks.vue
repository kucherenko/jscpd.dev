<script setup lang="ts">
// The header links of a docs page: the page's views from Cloudflare Web
// Analytics (composables/usePageViews.ts), then docus's own "Copy page" menu.
// The name is docus's, so its docs page renders this one.
import DocusPageHeaderLinks from 'docus/app/components/docs/DocsPageHeaderLinks.vue'
import { loadPageViews, MIN_VIEWS_SHOWN, viewsLabel } from '~/composables/usePageViews'

const route = useRoute()
const { data: views } = await useAsyncData(`page-views-${route.path}`, () => loadPageViews([route.path]))
const label = computed(() => {
  const n = views.value?.[route.path]?.views ?? 0
  return n >= MIN_VIEWS_SHOWN ? viewsLabel(n) : ''
})
</script>

<template>
  <span v-if="label" class="docs-page-views">{{ label }}</span>
  <DocusPageHeaderLinks />
</template>

<style scoped>
.docs-page-views {
  margin-right: 0.5rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
  white-space: nowrap;
}
</style>
