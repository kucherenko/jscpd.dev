<script setup lang="ts">
// The right column of the hero: the one install command the landing page
// shows, the pointer to every other way to install, and the proof line. The
// InstallCommand widget with its tabs is still available for pages that want
// all the methods.
</script>

<template>
  <TerminalFrame title="Install" class="hero-install">
    <CopyCommand
      cmd="curl -fsSL https://jscpd.dev/install.sh | bash"
      caption="macOS and Linux, one binary, no runtime"
    />
    <p class="hero-install-note">
      Windows, npm, pip, cargo, brew, nix and Docker:
      <NuxtLink to="/start/installation">all install options →</NuxtLink>
    </p>
    <p class="hero-install-note hero-install-proof">
      Runs inside GitHub Super Linter, MegaLinter and Codacy · 10M+ npm downloads a month
    </p>
  </TerminalFrame>
</template>

<style scoped>
.hero-install {
  width: 100%;
  max-width: 34rem;
}

.hero-install :deep(.copy-command) {
  margin: 0;
}

.hero-install-note {
  margin: 0.625rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ui-text-muted, #64748b);
}

.hero-install-note a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
  white-space: nowrap;
}

.hero-install-note a:hover {
  text-decoration: underline;
}

.hero-install-proof {
  margin-top: 0.875rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.12);
}
</style>
