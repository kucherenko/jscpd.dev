<template>
  <a
    href="https://github.com/kucherenko/jscpd"
    target="_blank"
    rel="noopener"
    class="gh-stars"
    aria-label="View jscpd on GitHub"
  >
    <Icon name="simple-icons:github" class="gh-icon" />
    <span>View on GitHub</span>
    <span class="gh-count" :title="countTitle">
      <Icon name="lucide:star" class="gh-star" />
      {{ label }}
    </span>
  </a>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Rendered at build time (and whenever the API is unreachable or
// rate-limited); replaced on the client once the live count arrives.
const FALLBACK = '6k+'

const label = ref(FALLBACK)
const countTitle = ref('GitHub stars')

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
      label.value = format(data.stargazers_count)
      countTitle.value = `${data.stargazers_count.toLocaleString('en-US')} stars`
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
  margin-top: 1rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ui-text, #e2e8f0);
  background: var(--ui-bg-elevated, rgba(148, 163, 184, 0.1));
  border: 1px solid var(--ui-border, rgba(148, 163, 184, 0.3));
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.gh-stars:hover {
  border-color: var(--jscpd-blue, #007bff);
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.1);
}

.gh-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.gh-star {
  width: 0.75rem;
  height: 0.75rem;
}

.gh-count {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.25rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 999px;
  font-weight: 600;
  color: #fff;
  background: var(--jscpd-blue, #007bff);
  white-space: nowrap;
}
</style>
