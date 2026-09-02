<script setup lang="ts">
// Head-only component for the landing page.
//
// The landing page's seo.title already starts with "jscpd", so the docus
// "%s - jscpd" template rendered it twice; this entry replaces the template
// for the home route only. It also adds the SoftwareApplication schema next
// to the WebSite schema docus emits.
useHead({
  titleTemplate: '%s',
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'jscpd',
        description: 'Copy/paste detector for programming source code. Rust-powered native binary, 24-37x faster. Supports 223+ languages.',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Linux, Windows',
        url: 'https://jscpd.dev',
        downloadUrl: 'https://www.npmjs.com/package/jscpd',
        license: 'https://opensource.org/licenses/MIT',
        author: { '@type': 'Person', name: 'Andrey Kucherenko', url: 'https://github.com/kucherenko' },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        sameAs: [
          'https://github.com/kucherenko/jscpd',
          'https://crates.io/crates/jscpd',
          'https://www.npmjs.com/package/jscpd',
        ],
      }),
    },
  ],
})
</script>

<template>
  <span hidden aria-hidden="true" />
</template>
