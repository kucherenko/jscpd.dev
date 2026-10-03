<template>
  <figure class="report-shot">
    <!-- The picture opens the live report too; keyboard users get the one
         link in the caption. -->
    <component
      :is="href ? 'a' : 'div'"
      class="report-shot-frame"
      v-bind="href ? { href, target: '_blank', rel: 'noopener', tabindex: -1 } : {}"
    >
      <img class="report-shot-img report-shot-light" :src="light" :alt="alt" :width="width" :height="height" loading="lazy" decoding="async">
      <img class="report-shot-img report-shot-dark" :src="dark || light" :alt="alt" :width="width" :height="height" loading="lazy" decoding="async">
    </component>
    <figcaption v-if="caption || href" class="report-shot-caption">
      <span v-if="caption">{{ caption }}</span>
      <a v-if="href" class="report-shot-open" :href="href" target="_blank" rel="noopener">
        {{ linkText || 'Open the report' }}<span aria-hidden="true"> ↗</span>
      </a>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
defineProps<{
  /** Screenshot for the light theme, under /public. */
  light: string
  /** Screenshot for the dark theme; the light one is used when missing. */
  dark?: string
  /** Accessible description of what the screenshot shows. */
  alt: string
  /** Intrinsic size of the images, so the page does not jump as they load. */
  width?: string | number
  height?: string | number
  /** Caption under the screenshot. */
  caption?: string
  /** The live report the screenshot was taken from; opens in a new tab. */
  href?: string
  /** Text of the link to `href`. */
  linkText?: string
}>()
</script>

<style scoped>
.report-shot {
  margin: 1.5rem 0;
}

.report-shot-frame {
  display: block;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid var(--ui-border);
}

.report-shot-img {
  display: block;
  width: 100%;
  height: auto;
}

.report-shot-caption {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #6b7280);
  text-align: center;
}

.report-shot-open {
  margin-left: 0.5rem;
  white-space: nowrap;
  font-weight: 500;
  color: var(--ui-primary, #0284c7);
}

.report-shot-open:hover {
  text-decoration: underline;
}
</style>

<!-- Theme switching keys off the `dark` class Nuxt's color mode sets on
     <html>, so it lives outside the scoped block. A hidden lazy image is
     never fetched, so each reader downloads one of the two. -->
<style>
.report-shot-dark {
  display: none !important;
}

html.dark .report-shot-light {
  display: none !important;
}

html.dark .report-shot-dark {
  display: block !important;
}
</style>
