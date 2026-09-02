<template>
  <a
    href="https://github.com/kucherenko/jscpd"
    target="_blank"
    rel="noopener"
    class="gh-stars"
    aria-label="Star jscpd on GitHub"
  >
    <Icon name="simple-icons:github" class="gh-icon" />
    <span>Star on GitHub</span>
    <span class="gh-count">{{ label }}</span>
  </a>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Rendered at build time (and whenever the API is unreachable or
// rate-limited); replaced on the client once the live count arrives.
const FALLBACK = '6k+ stars'

const label = ref(FALLBACK)

function format(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

onMounted(async () => {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4000)
    const res = await fetch('https://api.github.com/repos/kucherenko/jscpd', {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return
    const data = await res.json()
    if (typeof data?.stargazers_count === 'number') {
      label.value = `★ ${format(data.stargazers_count)}`
    }
  } catch {
    // keep the static fallback
  }
})
</script>

<style scoped>
.gh-stars {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.375rem 0.75rem 0.375rem 0.625rem;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--ui-text-muted, #94a3b8);
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.06);
  border: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.15);
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.gh-stars:hover {
  color: var(--ui-text, #e2e8f0);
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.12);
  border-color: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.3);
}

.gh-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.gh-count {
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-weight: 600;
  color: #fff;
  background: var(--jscpd-blue, #007bff);
  white-space: nowrap;
}
</style>
