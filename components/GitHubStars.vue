<template>
  <UButton
    to="https://github.com/kucherenko/jscpd"
    target="_blank"
    rel="noopener"
    color="neutral"
    variant="outline"
    size="xl"
    icon="i-simple-icons-github"
    class="gh-button"
    aria-label="View jscpd on GitHub"
  >
    View on GitHub
    <span class="gh-count" :title="countTitle">
      <Icon name="lucide:star" class="gh-star" />
      {{ label }}
    </span>
  </UButton>
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
/* Height, font and radius come from UButton size="xl", the same component
   the neighbouring hero buttons render with; only the star pill is ours. */
.gh-count {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.25rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.25;
  border-radius: 999px;
  font-weight: 600;
  color: #fff;
  background: var(--jscpd-blue, #007bff);
  white-space: nowrap;
}

.gh-star {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
