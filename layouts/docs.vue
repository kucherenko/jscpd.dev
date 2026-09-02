<!-- Overrides the docus layout only to give <main> the id the header's
     skip-to-content link targets. -->
<template>
  <UMain id="main">
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <DocsAsideLeftTop />
            <DocsAsideLeftBody />
          </UPageAside>
        </template>
        <slot />
      </UPage>
    </UContainer>
  </UMain>
</template>
