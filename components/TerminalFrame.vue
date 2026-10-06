<script setup lang="ts">
// The terminal card of the hero. The install widget and the feature slides
// share it, so the frame's look lives in one place; each of them fills the
// body and, if it needs one, the right side of the header.
withDefaults(defineProps<{ title?: string }>(), { title: 'Terminal' })
</script>

<template>
  <div class="hero-terminal">
    <div class="terminal-header">
      <div class="terminal-header-left">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
        <span class="terminal-title">{{ title }}</span>
      </div>
      <slot name="header" />
    </div>
    <div class="terminal-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.hero-terminal {
  background: linear-gradient(to bottom right,
    rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.05),
    rgba(var(--ui-color-secondary-rgb, 178, 0, 178), 0.05));
  border: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.15);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.hero-terminal:hover {
  transform: translateY(-2px);
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* The install tabs plus the title do not fit the card on every desktop
     width; let the tab strip drop to its own line instead of being clipped
     by the card's overflow: hidden. */
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1.25rem;
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.06);
  border-bottom: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.1);
}

.terminal-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.dot-red { background: #ef4444; }
.dot-yellow { background: #f59e0b; }
.dot-green { background: #22c55e; }

.terminal-title {
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #94a3b8);
  margin-left: 0.25rem;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
}

.terminal-body {
  padding: 1rem 1.25rem 1.25rem;
}

@media (max-width: 640px) {
  /* The seven install tabs need ~520px. Wrapping them stacked the header three
     rows deep (128px of chrome before any content); a horizontally scrollable
     strip keeps it to one row and is the familiar mobile pattern. */
  .terminal-header {
    gap: 0.5rem;
    padding: 0.625rem 0.75rem;
  }
  /* The traffic-light dots and the "Terminal" title are decoration; on a
     phone their row is better spent on the install tabs. */
  .terminal-header-left {
    display: none;
  }
}
</style>
