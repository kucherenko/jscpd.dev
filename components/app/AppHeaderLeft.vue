<script setup lang="ts">
const appConfig = useAppConfig()
const site = useSiteConfig()

const ariaLabel = `${appConfig.header?.title || site.name} home`
</script>

<template>
  <!-- First focusable element on every page; visible only while focused. -->
  <a href="#main" class="skip-link">Skip to content</a>

  <!-- The docus version wraps <AppHeaderLogo> in its own NuxtLink; ours
       renders the link here and keeps the logo a plain image so there is a
       single anchor rather than one nested in another. -->
  <NuxtLink
    to="/"
    :aria-label="ariaLabel"
    class="flex items-center gap-2 group shrink-0"
  >
    <AppHeaderLogo />
  </NuxtLink>
</template>

<style scoped>
.skip-link {
  position: absolute;
  left: 0.75rem;
  top: 0.75rem;
  z-index: 100;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  background: var(--jscpd-blue, #007bff);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-200%);
  transition: transform 0.15s ease;
}

.skip-link:focus,
.skip-link:focus-visible {
  transform: translateY(0);
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
