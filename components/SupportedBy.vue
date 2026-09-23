<script setup lang="ts">
// The logos of the open source programmes jscpd is supported by. Used on the
// landing page and on /support, which wrap it in their own heading and note.
const programmes = [
  {
    href: 'https://jb.gg/OpenSource',
    label: 'JetBrains — Open Source support programme',
    alt: 'JetBrains logo.',
    light: '/jetbrains.svg',
    dark: '/jetbrains-dark.svg',
    width: 298,
    height: 64,
    // The JetBrains mark is a square, so its logo carries the row's height.
    class: ''
  },
  {
    href: 'https://claude.com/contact-sales/claude-for-oss',
    label: 'Claude for Open Source programme',
    alt: 'Claude logo.',
    light: '/claude.svg',
    dark: '/claude-dark.svg',
    width: 512,
    height: 110,
    // A wordmark with no mark beside it needs a touch less height to sit
    // optically level with the one that has one.
    class: 'supported-by-link-wordmark'
  }
]
</script>

<template>
  <div class="supported-by-logos">
    <a
      v-for="programme in programmes"
      :key="programme.href"
      :href="programme.href"
      target="_blank"
      rel="noopener"
      class="supported-by-link"
      :class="programme.class"
      :aria-label="programme.label"
    >
      <UColorModeImage
        :light="programme.light"
        :dark="programme.dark"
        :alt="programme.alt"
        :width="programme.width"
        :height="programme.height"
      />
    </a>
  </div>
</template>

<style scoped>
.supported-by-logos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.25rem 2.5rem;
}

.supported-by-link {
  display: inline-flex;
  opacity: 0.85;
  transition: opacity 0.2s ease;
}

.supported-by-link:hover {
  opacity: 1;
}

/* UColorModeImage renders a light/dark pair from a fragment, so the scoped
   attribute never reaches the <img> — reach through to it */
.supported-by-link :deep(img) {
  height: 2.25rem;
  width: auto;
}

.supported-by-link-wordmark :deep(img) {
  height: 1.75rem;
}
</style>
