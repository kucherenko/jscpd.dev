<template>
  <div class="tsum">
    <div class="tsum-grid">
      <div v-for="t in tiles" :key="t.label" class="tsum-tile">
        <span class="tsum-value">{{ t.value }}</span>
        <span class="tsum-label">{{ t.label }}</span>
        <span v-if="t.hint" class="tsum-hint">{{ t.hint }}</span>
      </div>
    </div>

    <div class="tsum-highlights">
      <NuxtLink v-for="h in highlights" :key="h.label" :to="trendingRepoPath(h.name)" class="tsum-hl">
        <span class="tsum-hl-label">{{ h.label }}</span>
        <span class="tsum-hl-name">{{ h.name }}</span>
        <span v-if="h.percentage != null" class="dup-badge" :class="dupClass(h.percentage)">{{ h.percentage }}%</span>
        <span v-else class="tsum-hl-num">{{ num(h.clones) }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DaySummary } from '~/composables/useTrendingData'

const props = defineProps<{ summary: DaySummary }>()

const tiles = computed(() => {
  const s = props.summary
  const coded = s.codeMedianPercentage != null
  return [
    { label: 'repos analyzed', value: String(s.repos), hint: coded ? `${s.codeRepos} with a code-only scan` : undefined },
    { label: 'files scanned', value: compact(s.sources), hint: coded ? `${compact(s.codeSources)} count as code` : undefined },
    { label: 'lines scanned', value: compact(s.lines) },
    { label: 'clones found', value: compact(s.clones), hint: coded ? `${compact(s.codeClones)} in code` : undefined },
    coded
      ? { label: 'median code duplication', value: `${s.codeMedianPercentage}%`, hint: `all files ${s.medianPercentage}%` }
      : { label: 'median duplication, all files', value: `${s.medianPercentage}%`, hint: `mean ${s.avgPercentage}%` },
    ...(coded ? [{ label: 'generated files skipped', value: String(s.generatedFiles ?? 0) }] : [])
  ]
})

const highlights = computed(() => {
  const s = props.summary
  const list: Array<{ label: string, name: string, percentage?: number, clones?: number }> = []
  const most = s.codeMostDuplicated ?? s.mostDuplicated
  const cleanest = s.codeCleanest ?? s.cleanest
  const scope = s.codeMostDuplicated ? ' code' : ''
  if (most) list.push({ label: `Most duplicated${scope}`, name: most.name, percentage: most.percentage })
  if (cleanest && cleanest.name !== most?.name) list.push({ label: `Cleanest${scope}`, name: cleanest.name, percentage: cleanest.percentage })
  if (s.mostClones) list.push({ label: 'Most clones, all files', name: s.mostClones.name, clones: s.mostClones.clones })
  return list
})
</script>

<style scoped>
.tsum {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tsum-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.625rem;
}

.tsum-tile {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
}

.tsum-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--ui-text-highlighted, inherit);
}

.tsum-label {
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.tsum-hint {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
  opacity: 0.8;
}

.tsum-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.625rem;
}

.tsum-hl {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s ease;
}

.tsum-hl:hover {
  border-color: rgba(0, 123, 255, 0.4);
}

.tsum-hl-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.tsum-hl-name {
  flex: 1;
  min-width: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
  overflow-wrap: anywhere;
}

.tsum-hl-num {
  font-size: 0.8125rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
