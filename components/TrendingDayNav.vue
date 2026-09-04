<template>
  <nav class="daynav" aria-label="Analysis day">
    <NuxtLink v-if="prev" :to="trendingDayPath(prev, latestTrendingDate)" class="daynav-btn" :aria-label="`Previous day, ${formatDay(prev)}`">
      <Icon name="lucide:chevron-left" class="daynav-icon" />
      <span class="daynav-btn-label">{{ shortDay(prev) }}</span>
    </NuxtLink>
    <span v-else class="daynav-btn disabled" aria-hidden="true">
      <Icon name="lucide:chevron-left" class="daynav-icon" />
    </span>

    <label class="daynav-current">
      <span class="sr-only">Choose an analysis day</span>
      <select class="daynav-select" :value="date" @change="onChange">
        <option v-for="d in [...trendingDates].reverse()" :key="d" :value="d">
          {{ formatDay(d) }}{{ d === latestTrendingDate ? ' (latest)' : '' }}
        </option>
      </select>
      <Icon name="lucide:calendar-days" class="daynav-icon daynav-cal" />
    </label>

    <NuxtLink v-if="next" :to="trendingDayPath(next, latestTrendingDate)" class="daynav-btn" :aria-label="`Next day, ${formatDay(next)}`">
      <span class="daynav-btn-label">{{ shortDay(next) }}</span>
      <Icon name="lucide:chevron-right" class="daynav-icon" />
    </NuxtLink>
    <span v-else class="daynav-btn disabled" aria-hidden="true">
      <Icon name="lucide:chevron-right" class="daynav-icon" />
    </span>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { latestTrendingDate, trendingDates } from '~/composables/useTrendingData'

const props = defineProps<{ date: string }>()

const idx = computed(() => trendingDates.indexOf(props.date))
const prev = computed(() => idx.value > 0 ? trendingDates[idx.value - 1] : null)
const next = computed(() => idx.value !== -1 && idx.value < trendingDates.length - 1 ? trendingDates[idx.value + 1] : null)

const onChange = (e: Event) => navigateTo(trendingDayPath((e.target as HTMLSelectElement).value, latestTrendingDate))
</script>

<style scoped>
.daynav {
  display: inline-flex;
  align-items: stretch;
  gap: 0.375rem;
}

.daynav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 9999px;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
  text-decoration: none;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.daynav-btn:hover {
  border-color: rgba(0, 123, 255, 0.4);
  color: var(--jscpd-blue, #007bff);
}

.daynav-btn.disabled {
  opacity: 0.35;
}

.daynav-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.daynav-current {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.daynav-select {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.375rem 2.125rem 0.375rem 0.875rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 9999px;
  background: transparent;
  color: var(--ui-text-highlighted, inherit);
  cursor: pointer;
}

.daynav-select:hover {
  border-color: rgba(0, 123, 255, 0.4);
}

.daynav-cal {
  position: absolute;
  right: 0.75rem;
  pointer-events: none;
  color: var(--ui-text-muted, #64748b);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 480px) {
  .daynav-btn-label {
    display: none;
  }
}
</style>
