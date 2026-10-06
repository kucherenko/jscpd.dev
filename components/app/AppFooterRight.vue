<script setup lang="ts">
const links = [
  {
    icon: 'i-lucide-book-open',
    label: 'Docs',
    to: '/start'
  },
  {
    icon: 'i-lucide-scroll-text',
    label: 'Changelog',
    to: '/project/changelog'
  },
  {
    icon: 'i-lucide-trending-up',
    label: 'Trending',
    to: '/trending'
  },
  {
    icon: 'i-lucide-heart',
    label: 'Support',
    to: '/support'
  },
  {
    icon: 'i-simple-icons-github',
    label: 'GitHub',
    to: 'https://github.com/kucherenko/jscpd',
    target: '_blank' as const
  },
  {
    icon: 'i-simple-icons-x',
    label: 'X',
    to: 'https://x.com/a_kucherenko',
    target: '_blank' as const
  }
]
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-end sm:gap-4">
    <UButton
      v-for="link in links"
      :key="link.label"
      :icon="link.icon"
      :to="link.to"
      :target="link.target"
      :aria-label="link.label"
      color="neutral"
      variant="ghost"
      size="sm"
      :label="link.label"
    />
    <UColorModeButton />
  </div>
</template>
