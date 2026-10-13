<template>
  <div class="schart">
    <div class="schart-head">
      <div>
        <h2 class="schart-title">Day by day</h2>
        <p class="schart-sub">{{ activeMetric.label }} per day, UTC<template v-if="points.length < days.length">, the last {{ points.length }} days</template></p>
      </div>
      <div class="schart-metrics" role="tablist" aria-label="Chart metric">
        <button
          v-for="m in metrics"
          :key="m.key"
          type="button"
          role="tab"
          class="schart-metric"
          :class="{ active: metric === m.key }"
          :aria-selected="metric === m.key"
          @click="metric = m.key"
        >{{ m.label }}</button>
      </div>
    </div>

    <div class="schart-plot" @mouseleave="hover = null">
      <svg :viewBox="`0 0 ${W} ${H}`" class="schart-svg" role="img" :aria-label="`${activeMetric.label} per day for the last ${points.length} days`">
        <g class="schart-grid">
          <line v-for="t in ticks" :key="t" :x1="PAD.left" :x2="W - PAD.right" :y1="y(t)" :y2="y(t)" />
          <text v-for="t in ticks" :key="`l${t}`" :x="PAD.left - 8" :y="y(t)" dy="0.35em" text-anchor="end">{{ compact(t) }}</text>
        </g>
        <g v-for="(p, i) in points" :key="p.date">
          <path :d="bar(i, p.value)" class="schart-bar" :class="{ hover: hover === i, partial: p.date === partial }" />
          <text v-if="i % labelEvery === 0" :x="cx(i)" :y="H - PAD.bottom + 16" text-anchor="middle" class="schart-xlabel">{{ shortDay(p.date) }}</text>
          <rect
            :x="PAD.left + i * slot"
            :y="PAD.top"
            :width="slot"
            :height="plotH"
            class="schart-hit"
            tabindex="0"
            :aria-label="`${formatDay(p.date)}: ${activeMetric.full(p.value)}`"
            @mouseenter="hover = i"
            @focus="hover = i"
            @blur="hover = null"
          />
        </g>
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="y(0)" :y2="y(0)" class="schart-axis" />
      </svg>

      <div
        v-if="hover !== null && points[hover]"
        class="schart-tip"
        :style="{ left: `${(cx(hover) / W) * 100}%`, top: `${(y(points[hover]!.value) / H) * 100}%` }"
      >
        <span class="schart-tip-date">{{ formatDay(points[hover]!.date) }}<template v-if="points[hover]!.date === partial"> (so far)</template></span>
        <span class="schart-tip-value">{{ activeMetric.full(points[hover]!.value) }}</span>
        <span class="schart-tip-meta">{{ otherMetric.full(points[hover]!.other) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DayPoint } from '~/composables/useSiteStats'

// `partial` is the day the snapshot was taken on, counted up to that moment.
const props = defineProps<{ days: DayPoint[], partial?: string | null }>()

type MetricKey = 'visits' | 'views'
interface Metric { key: MetricKey, label: string, full: (v: number) => string }
const metrics: Metric[] = [
  { key: 'visits', label: 'Visits', full: v => `${num(v)} ${v === 1 ? 'visit' : 'visits'}` },
  { key: 'views', label: 'Page views', full: v => `${num(v)} page ${v === 1 ? 'view' : 'views'}` }
]
const metric = ref<MetricKey>('visits')
const activeMetric = computed(() => metrics.find(m => m.key === metric.value)!)
const otherMetric = computed(() => metrics.find(m => m.key !== metric.value)!)
const hover = ref<number | null>(null)

const MAX_POINTS = 90
const points = computed(() => props.days.slice(-MAX_POINTS).map(d => ({
  date: d.date,
  value: d[metric.value],
  other: d[otherMetric.value.key]
})))

const W = 720
const H = 240
const PAD = { top: 12, right: 12, bottom: 28, left: 48 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const ticks = computed(() => {
  const max = Math.max(1, ...points.value.map(p => p.value))
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s >= raw) ?? raw
  const out: number[] = []
  for (let t = 0; t <= max + step - 1e-9; t += step) out.push(Math.round(t * 100) / 100)
  return out
})
const yMax = computed(() => ticks.value[ticks.value.length - 1] || 1)
const y = (v: number) => PAD.top + plotH - (v / yMax.value) * plotH

const slot = computed(() => plotW / Math.max(points.value.length, 1))
const barW = computed(() => Math.min(24, slot.value * 0.7))
const cx = (i: number) => PAD.left + i * slot.value + slot.value / 2

function bar(i: number, v: number) {
  const x = cx(i) - barW.value / 2
  const top = y(v)
  const base = y(0)
  const r = Math.min(4, barW.value / 2, base - top)
  if (base - top <= 0) return ''
  return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW.value - r} Q${x + barW.value},${top} ${x + barW.value},${top + r} V${base} Z`
}

const labelEvery = computed(() => Math.ceil(points.value.length / 8))
</script>

<style scoped>
.schart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 0.75rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
}

.schart-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.schart-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.schart-sub {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.schart-metrics {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.125rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 9999px;
}

.schart-metric {
  font: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: var(--ui-text-muted, #64748b);
  cursor: pointer;
}

.schart-metric.active {
  background: var(--jscpd-blue, #007bff);
  color: #fff;
}

.schart-plot {
  position: relative;
}

.schart-svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.schart-grid line {
  stroke: var(--ui-border, rgba(100, 116, 139, 0.25));
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.schart-grid text,
.schart-xlabel {
  font-size: 11px;
  fill: var(--ui-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
}

.schart-axis {
  stroke: var(--ui-text-muted, #64748b);
  stroke-opacity: 0.5;
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.schart-bar {
  fill: var(--jscpd-blue, #007bff);
  fill-opacity: 0.55;
  transition: fill-opacity 0.15s ease;
}

.schart-bar.partial {
  fill-opacity: 0.25;
}

.schart-bar.hover {
  fill-opacity: 1;
}

.schart-hit {
  fill: transparent;
  outline: none;
}

.schart-hit:focus-visible {
  fill: rgba(0, 123, 255, 0.08);
}

.schart-tip {
  position: absolute;
  transform: translate(-50%, calc(-100% - 10px));
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  background: var(--ui-bg-elevated, #fff);
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  pointer-events: none;
  white-space: nowrap;
  z-index: 2;
}

.schart-tip-date {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.schart-tip-value {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.schart-tip-meta {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

@media (max-width: 640px) {
  .schart {
    padding: 0.875rem 0.875rem 0.625rem;
  }
}
</style>
