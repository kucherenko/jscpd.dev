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
      <NuxtLink v-if="summary.mostDuplicated" :to="trendingRepoPath(summary.mostDuplicated.name)" class="tsum-hl">
        <span class="tsum-hl-label">Most duplicated</span>
        <span class="tsum-hl-name">{{ summary.mostDuplicated.name }}</span>
        <span class="dup-badge" :class="dupClass(summary.mostDuplicated.percentage)">{{ summary.mostDuplicated.percentage }}%</span>
      </NuxtLink>
      <NuxtLink v-if="summary.mostClones" :to="trendingRepoPath(summary.mostClones.name)" class="tsum-hl">
        <span class="tsum-hl-label">Most clones</span>
        <span class="tsum-hl-name">{{ summary.mostClones.name }}</span>
        <span class="tsum-hl-num">{{ num(summary.mostClones.clones) }}</span>
      </NuxtLink>
      <NuxtLink v-if="summary.cleanest" :to="trendingRepoPath(summary.cleanest.name)" class="tsum-hl">
        <span class="tsum-hl-label">Cleanest</span>
        <span class="tsum-hl-name">{{ summary.cleanest.name }}</span>
        <span class="dup-badge" :class="dupClass(summary.cleanest.percentage)">{{ summary.cleanest.percentage }}%</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DaySummary } from '~/composables/useTrendingData'

const props = defineProps<{ summary: DaySummary }>()

const tiles = computed(() => [
  { label: 'repos analyzed', value: String(props.summary.repos) },
  { label: 'files scanned', value: compact(props.summary.sources) },
  { label: 'lines scanned', value: compact(props.summary.lines) },
  { label: 'clones found', value: compact(props.summary.clones) },
  { label: 'duplicated lines', value: compact(props.summary.duplicatedLines), hint: `${props.summary.percentage}% of all lines` },
  { label: 'median duplication', value: `${props.summary.medianPercentage}%`, hint: `mean ${props.summary.avgPercentage}%` }
])
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
