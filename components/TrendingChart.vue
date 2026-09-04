<template>
  <div class="tchart">
    <div class="tchart-head">
      <div>
        <h3 class="tchart-title">Daily totals across trending repos</h3>
        <p class="tchart-sub">{{ activeMetric.label }} per analysis day · click a day to open it</p>
      </div>
      <div class="tchart-metrics" role="tablist" aria-label="Chart metric">
        <button
          v-for="m in metrics"
          :key="m.key"
          type="button"
          role="tab"
          class="tchart-metric"
          :class="{ active: metric === m.key }"
          :aria-selected="metric === m.key"
          @click="metric = m.key"
        >{{ m.label }}</button>
      </div>
    </div>

    <div class="tchart-plot" @mouseleave="hover = null">
      <svg :viewBox="`0 0 ${W} ${H}`" class="tchart-svg" role="img" :aria-label="`${activeMetric.label} for the last ${points.length} analysis days`">
        <g class="tchart-grid">
          <line v-for="t in ticks" :key="t" :x1="PAD.left" :x2="W - PAD.right" :y1="y(t)" :y2="y(t)" />
          <text v-for="t in ticks" :key="`l${t}`" :x="PAD.left - 8" :y="y(t)" dy="0.35em" text-anchor="end">{{ activeMetric.tick(t) }}</text>
        </g>
        <g v-for="(p, i) in points" :key="p.date">
          <path :d="bar(i, p.value)" class="tchart-bar" :class="{ selected: p.date === selected, hover: hover === i }" />
          <text
            v-if="showLabel(i, p.date)"
            :x="cx(i)"
            :y="H - PAD.bottom + 16"
            text-anchor="middle"
            class="tchart-xlabel"
            :class="{ selected: p.date === selected }"
          >{{ shortDay(p.date) }}</text>
          <rect
            :x="PAD.left + i * slot"
            :y="PAD.top"
            :width="slot"
            :height="plotH"
            class="tchart-hit"
            tabindex="0"
            role="link"
            :aria-label="`${formatDay(p.date)}: ${activeMetric.full(p.value)}`"
            @mouseenter="hover = i"
            @focus="hover = i"
            @blur="hover = null"
            @click="open(p.date)"
            @keydown.enter.prevent="open(p.date)"
            @keydown.space.prevent="open(p.date)"
          />
        </g>
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="y(0)" :y2="y(0)" class="tchart-axis" />
      </svg>

      <div
        v-if="hover !== null && points[hover]"
        class="tchart-tip"
        :style="{ left: `${(cx(hover) / W) * 100}%`, top: `${(y(points[hover]!.value) / H) * 100}%` }"
      >
        <span class="tchart-tip-date">{{ formatDay(points[hover]!.date) }}</span>
        <span class="tchart-tip-value">{{ activeMetric.full(points[hover]!.value) }}</span>
        <span class="tchart-tip-meta">{{ tipMeta(points[hover]!) }}</span>
      </div>
    </div>

    <details class="tchart-table">
      <summary>Show as table</summary>
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Day</th><th>Repos</th><th>Lines</th><th>Clones</th><th>Duplicated lines</th><th>Duplication</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in [...days].reverse()" :key="d.date" :class="{ selected: d.date === selected }">
              <td><NuxtLink :to="trendingDayPath(d.date, latest)">{{ formatDay(d.date, { year: 'numeric', month: 'short', day: 'numeric' }) }}</NuxtLink></td>
              <td>{{ d.repos }}</td>
              <td>{{ num(d.lines) }}</td>
              <td>{{ num(d.clones) }}</td>
              <td>{{ num(d.duplicatedLines) }}</td>
              <td>{{ d.percentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HistoryDay } from '~/composables/useTrendingData'

const props = defineProps<{ days: HistoryDay[], selected: string, latest: string }>()

type MetricKey = 'clones' | 'duplicatedLines' | 'percentage'
interface Metric { key: MetricKey, label: string, tick: (v: number) => string, full: (v: number) => string }

const metrics: Metric[] = [
  { key: 'clones', label: 'Clones', tick: compact, full: v => `${num(v)} clones` },
  { key: 'duplicatedLines', label: 'Duplicated lines', tick: compact, full: v => `${num(v)} duplicated lines` },
  { key: 'percentage', label: 'Duplication %', tick: v => `${v}%`, full: v => `${v}% of scanned lines duplicated` }
]
const metric = ref<MetricKey>('clones')
const activeMetric = computed(() => metrics.find(m => m.key === metric.value)!)
const hover = ref<number | null>(null)

// keep the chart readable: at most this many columns, always including the selected day
const MAX_POINTS = 60
const points = computed(() => {
  const all = props.days
  const selIdx = Math.max(0, all.findIndex(d => d.date === props.selected))
  // latest window by default; centre an older selected day instead
  const end = selIdx >= all.length - MAX_POINTS ? all.length : Math.min(all.length, selIdx + Math.ceil(MAX_POINTS / 2))
  const start = Math.max(0, end - MAX_POINTS)
  return all.slice(start, end).map(d => ({ date: d.date, value: d[metric.value] ?? 0, repos: d.repos, clones: d.clones, percentage: d.percentage }))
})

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
const showLabel = (i: number, date: string) => {
  if (date === props.selected) return true
  const selIdx = points.value.findIndex(p => p.date === props.selected)
  // skip neighbours of the selected label so they don't collide
  if (selIdx !== -1 && Math.abs(i - selIdx) < labelEvery.value) return false
  return i % labelEvery.value === 0
}

// the tooltip's second line carries whatever the headline value doesn't
const tipMeta = (p: { repos: number, clones: number, percentage: number }) => [
  `${p.repos} repos`,
  metric.value === 'clones' ? null : `${num(p.clones)} clones`,
  metric.value === 'percentage' ? null : `${p.percentage}% duplicated`
].filter(Boolean).join(' · ')

const open = (date: string) => navigateTo(trendingDayPath(date, props.latest))
</script>

<style scoped>
.tchart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 0.75rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
}

.tchart-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.tchart-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.tchart-sub {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.tchart-metrics {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.125rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 9999px;
}

.tchart-metric {
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

.tchart-metric.active {
  background: var(--jscpd-blue, #007bff);
  color: #fff;
}

.tchart-plot {
  position: relative;
}

.tchart-svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.tchart-grid line {
  stroke: var(--ui-border, rgba(100, 116, 139, 0.25));
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.tchart-grid text,
.tchart-xlabel {
  font-size: 11px;
  fill: var(--ui-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
}

.tchart-xlabel.selected {
  fill: var(--ui-text-highlighted, currentColor);
  font-weight: 600;
}

.tchart-axis {
  stroke: var(--ui-text-muted, #64748b);
  stroke-opacity: 0.5;
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.tchart-bar {
  fill: var(--jscpd-blue, #007bff);
  fill-opacity: 0.35;
  transition: fill-opacity 0.15s ease;
}

.tchart-bar.hover {
  fill-opacity: 0.65;
}

.tchart-bar.selected {
  fill-opacity: 1;
}

.tchart-hit {
  fill: transparent;
  cursor: pointer;
  outline: none;
}

.tchart-hit:focus-visible {
  fill: rgba(0, 123, 255, 0.08);
}

.tchart-tip {
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

.tchart-tip-date {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.tchart-tip-value {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.tchart-tip-meta {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.tchart-table summary {
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.table-scroll {
  overflow-x: auto;
  margin-top: 0.5rem;
}

.tchart-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.tchart-table th,
.tchart-table td {
  text-align: left;
  padding: 0.375rem 0.75rem;
  border-bottom: 1px solid var(--ui-border, rgba(100, 116, 139, 0.12));
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.tchart-table th {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.tchart-table tr.selected td {
  font-weight: 600;
}

.tchart-table a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.tchart-table a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .tchart {
    padding: 0.875rem 0.875rem 0.625rem;
  }
}
</style>
