<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { embeddingModels, type EmbeddingModelResult } from '~/data/embedding-models'

// One of three charts of the embedding-model comparison:
// - duplicates: estimated real duplicates on the 14 shared projects;
// - recall: Rosetta Code recall at jina-v2's precision, across and within;
// - scale: where each model puts partners and impostors, and its threshold.
const props = defineProps<{ chart: 'duplicates' | 'recall' | 'scale' }>()

// The chart is drawn at the width it gets, so text keeps its size on a
// phone; 640 until the page has measured it.
const plotRef = ref<HTMLElement | null>(null)
const width = ref(640)
let observer: ResizeObserver | null = null
onMounted(() => {
  if (!plotRef.value) return
  observer = new ResizeObserver(([entry]) => {
    width.value = Math.max(Math.round(entry.contentRect.width), 320)
  })
  observer.observe(plotRef.value)
})
onUnmounted(() => observer?.disconnect())

const W = computed(() => width.value)
const LABEL_W = 132
const RIGHT = 52
const ROW_H = 30
const TOP = 6
const AXIS_H = 26
const plotW = computed(() => W.value - LABEL_W - RIGHT)

interface Axis { min: number; max: number; ticks: number[]; format: (v: number) => string }

const axes: Record<typeof props.chart, Axis> = {
  duplicates: { min: 0, max: 3000, ticks: [0, 1000, 2000, 3000], format: v => v.toLocaleString('en-US') },
  recall: { min: 0.25, max: 0.65, ticks: [0.3, 0.4, 0.5, 0.6], format: v => v.toFixed(1) },
  scale: { min: 0.2, max: 0.95, ticks: [0.2, 0.4, 0.6, 0.8], format: v => v.toFixed(1) },
}

const axis = computed(() => axes[props.chart])

const rows = computed<EmbeddingModelResult[]>(() => {
  const list = [...embeddingModels]
  if (props.chart === 'duplicates') list.sort((a, b) => b.estimatedDuplicates - a.estimatedDuplicates)
  if (props.chart === 'recall') list.sort((a, b) => b.recallAcross - a.recallAcross)
  if (props.chart === 'scale') list.sort((a, b) => a.threshold - b.threshold)
  return list
})

const H = computed(() => TOP + rows.value.length * ROW_H + AXIS_H)

function x(v: number): number {
  const { min, max } = axis.value
  return LABEL_W + ((v - min) / (max - min)) * plotW.value
}

function rowY(i: number): number {
  return TOP + i * ROW_H + ROW_H / 2
}

/** A bar from the baseline with a 4px rounded data end. */
function barPath(value: number, i: number): string {
  const h = 14
  const r = 4
  const x0 = x(0)
  const w = Math.max(x(value) - x0, r)
  const y = rowY(i) - h / 2
  return `M${x0},${y} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - r} z`
}

const title = computed(() => ({
  duplicates: 'Estimated real duplicates on 14 projects',
  recall: 'Known clones found on Rosetta Code at equal precision',
  scale: 'Where each model puts similar and dissimilar code',
}[props.chart]))

const subtitle = computed(() => ({
  duplicates: 'Pairs reported × the share of duplicates among 30 blind-judged pairs. jscpd’s default model is highlighted.',
  recall: 'Recall at the precision jina-v2 has at its thresholds, 0.6 and 0.75.',
  scale: 'Median cosine of a function and its partner in another language, and of the most similar function from another task. The tick is the model’s threshold across languages.',
}[props.chart]))

const ariaLabel = computed(() => `${title.value}. The table above lists the same numbers.`)

/** What a screen reader says on a row. */
function rowLabel(m: EmbeddingModelResult): string {
  if (props.chart === 'duplicates') {
    return `${m.name}: ${m.estimatedDuplicates} estimated duplicates, ${m.pairs} pairs, ${m.duplicateShare}% duplicates`
  }
  if (props.chart === 'recall') {
    return `${m.name}: recall ${pct(m.recallAcross)} across languages, ${pct(m.recallWithin)} within a language`
  }
  return `${m.name}: partner ${m.partnerCosine}, impostor ${m.impostorCosine}, threshold ${m.threshold}`
}

// Hover and keyboard focus share one tooltip.
const active = ref<number | null>(null)
const activeRow = computed(() => (active.value === null ? null : rows.value[active.value]))

function tooltipStyle(i: number) {
  const m = rows.value[i]
  const anchor = props.chart === 'duplicates' ? m.estimatedDuplicates
    : props.chart === 'recall' ? Math.max(m.recallAcross, m.recallWithin)
      : m.partnerCosine
  const left = Math.min((x(anchor) / W.value) * 100, 55)
  const top = ((rowY(i) + ROW_H / 2) / H.value) * 100
  return { left: `${left}%`, top: `${top}%` }
}

function pct(v: number): string {
  return v.toFixed(3)
}
</script>

<template>
  <figure class="emb">
    <figcaption class="emb-head">
      <span class="emb-title">{{ title }}</span>
      <span class="emb-sub">{{ subtitle }}</span>
    </figcaption>

    <div v-if="chart === 'recall'" class="emb-legend">
      <span class="emb-key"><span class="emb-dot emb-dot--s1" />Across languages</span>
      <span class="emb-key"><span class="emb-dot emb-dot--s2" />Within a language</span>
    </div>
    <div v-else-if="chart === 'scale'" class="emb-legend">
      <span class="emb-key"><span class="emb-dot emb-dot--s1" />Partner</span>
      <span class="emb-key"><span class="emb-dot emb-dot--s2" />Impostor</span>
      <span class="emb-key"><span class="emb-tick" />Threshold across languages</span>
    </div>

    <div ref="plotRef" class="emb-plot">
      <svg :viewBox="`0 0 ${W} ${H}`" class="emb-svg" role="group" :aria-label="ariaLabel">
        <g class="emb-grid" aria-hidden="true">
          <line
            v-for="t in axis.ticks" :key="t"
            :x1="x(t)" :x2="x(t)" :y1="TOP" :y2="H - AXIS_H + 4"
          />
          <text
            v-for="t in axis.ticks" :key="`l${t}`"
            :x="x(t)" :y="H - 8" text-anchor="middle" class="emb-axis-label"
          >{{ axis.format(t) }}</text>
        </g>

        <g
          v-for="(m, i) in rows" :key="m.name"
          class="emb-row" :class="{ 'emb-row--active': active === i }"
          tabindex="0" role="img"
          :aria-label="rowLabel(m)"
          @pointerenter="active = i" @pointerleave="active = null"
          @focus="active = i" @blur="active = null"
        >
          <rect class="emb-hit" :x="0" :y="rowY(i) - ROW_H / 2" :width="W" :height="ROW_H" />
          <text :x="LABEL_W - 10" :y="rowY(i) + 4" text-anchor="end" class="emb-name" :class="{ 'emb-name--default': m.isDefault }">{{ m.name }}</text>

          <template v-if="chart === 'duplicates'">
            <path :d="barPath(m.estimatedDuplicates, i)" :class="m.isDefault ? 'emb-bar emb-bar--em' : 'emb-bar'" />
            <text :x="x(m.estimatedDuplicates) + 6" :y="rowY(i) + 4" class="emb-value">{{ m.estimatedDuplicates.toLocaleString('en-US') }}</text>
          </template>

          <template v-else-if="chart === 'recall'">
            <line class="emb-link" :x1="x(m.recallWithin)" :x2="x(m.recallAcross)" :y1="rowY(i)" :y2="rowY(i)" />
            <circle class="emb-mark emb-mark--s2" :cx="x(m.recallWithin)" :cy="rowY(i)" r="5" />
            <circle class="emb-mark emb-mark--s1" :cx="x(m.recallAcross)" :cy="rowY(i)" r="5" />
          </template>

          <template v-else>
            <line class="emb-link" :x1="x(m.impostorCosine)" :x2="x(m.partnerCosine)" :y1="rowY(i)" :y2="rowY(i)" />
            <line class="emb-threshold" :x1="x(m.threshold)" :x2="x(m.threshold)" :y1="rowY(i) - 8" :y2="rowY(i) + 8" />
            <circle class="emb-mark emb-mark--s2" :cx="x(m.impostorCosine)" :cy="rowY(i)" r="5" />
            <circle class="emb-mark emb-mark--s1" :cx="x(m.partnerCosine)" :cy="rowY(i)" r="5" />
          </template>
        </g>
      </svg>

      <div v-if="activeRow && active !== null" class="emb-tip" :style="tooltipStyle(active)" role="status">
        <template v-if="chart === 'duplicates'">
          <div class="emb-tip-value">{{ activeRow.estimatedDuplicates.toLocaleString('en-US') }} duplicates</div>
          <div class="emb-tip-label">{{ activeRow.name }}: {{ activeRow.pairs.toLocaleString('en-US') }} pairs, {{ activeRow.duplicateShare }}% ± {{ activeRow.duplicateMargin }} of them duplicates</div>
        </template>
        <template v-else-if="chart === 'recall'">
          <div class="emb-tip-label">{{ activeRow.name }}</div>
          <div class="emb-tip-line"><span class="emb-line-key emb-line-key--s1" /><strong>{{ pct(activeRow.recallAcross) }}</strong> across languages</div>
          <div class="emb-tip-line"><span class="emb-line-key emb-line-key--s2" /><strong>{{ pct(activeRow.recallWithin) }}</strong> within a language</div>
        </template>
        <template v-else>
          <div class="emb-tip-label">{{ activeRow.name }}</div>
          <div class="emb-tip-line"><span class="emb-line-key emb-line-key--s1" /><strong>{{ activeRow.partnerCosine.toFixed(2) }}</strong> partner</div>
          <div class="emb-tip-line"><span class="emb-line-key emb-line-key--s2" /><strong>{{ activeRow.impostorCosine.toFixed(2) }}</strong> impostor</div>
          <div class="emb-tip-line"><span class="emb-line-key emb-line-key--ink" /><strong>{{ activeRow.threshold }}</strong> threshold</div>
        </template>
      </div>
    </div>
  </figure>
</template>

<style scoped>
.emb {
  --emb-s1: #2a78d6;
  --emb-s2: #eb6834;
  --emb-muted: #cbd5e1;
  --emb-surface: var(--ui-bg, #ffffff);
  margin: 1.25rem 0 1.75rem;
}

.emb-head {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.6rem;
}

.emb-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.emb-sub {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--ui-text-muted, #64748b);
}

.emb-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.emb-key {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.emb-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
}

.emb-dot--s1 { background: var(--emb-s1); }
.emb-dot--s2 { background: var(--emb-s2); }

.emb-tick {
  width: 2px;
  height: 0.8rem;
  background: var(--ui-text-highlighted, #0f172a);
}

.emb-plot {
  position: relative;
}

.emb-svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.emb-grid line {
  stroke: var(--ui-border, rgba(100, 116, 139, 0.25));
  stroke-width: 1;
}

.emb-axis-label {
  font-size: 11px;
  fill: var(--ui-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
}

.emb-hit {
  fill: transparent;
}

.emb-row {
  outline: none;
  cursor: default;
}

.emb-row--active .emb-hit {
  fill: var(--ui-bg-elevated, rgba(100, 116, 139, 0.08));
}

.emb-row:focus-visible .emb-hit {
  stroke: var(--emb-s1);
  stroke-width: 1;
}

.emb-name {
  font-size: 12px;
  fill: var(--ui-text, #334155);
}

.emb-name--default {
  font-weight: 700;
  fill: var(--ui-text-highlighted, #0f172a);
}

.emb-bar {
  fill: var(--emb-muted);
}

.emb-bar--em {
  fill: var(--emb-s1);
}

.emb-value {
  font-size: 11px;
  fill: var(--ui-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
}

.emb-link {
  stroke: var(--emb-muted);
  stroke-width: 2;
  stroke-linecap: round;
}

.emb-threshold {
  stroke: var(--ui-text-highlighted, #0f172a);
  stroke-width: 2;
  stroke-linecap: round;
}

.emb-mark {
  stroke: var(--emb-surface);
  stroke-width: 2;
}

.emb-mark--s1 { fill: var(--emb-s1); }
.emb-mark--s2 { fill: var(--emb-s2); }

.emb-tip {
  position: absolute;
  transform: translate(0, 0.25rem);
  pointer-events: none;
  z-index: 2;
  min-width: 11rem;
  max-width: 18rem;
  padding: 0.45rem 0.6rem;
  border-radius: 0.4rem;
  background: var(--ui-bg-elevated, #fff);
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--ui-text-muted, #64748b);
}

.emb-tip-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.emb-tip-label {
  color: var(--ui-text-muted, #64748b);
}

.emb-tip-line {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.emb-tip-line strong {
  color: var(--ui-text-highlighted, inherit);
  font-variant-numeric: tabular-nums;
}

.emb-line-key {
  display: inline-block;
  width: 0.8rem;
  height: 2px;
  border-radius: 1px;
}

.emb-line-key--s1 { background: var(--emb-s1); }
.emb-line-key--s2 { background: var(--emb-s2); }
.emb-line-key--ink { background: var(--ui-text-highlighted, #0f172a); }

@media (prefers-reduced-motion: no-preference) {
  .emb-hit { transition: fill 0.12s ease; }
}
</style>

<style>
/* Dark steps of the same hues, validated against the dark surface. Not
   scoped: a scoped :global(.dark) would drop the .emb part. */
html.dark .emb {
  --emb-s1: #3987e5;
  --emb-s2: #d95926;
  --emb-muted: #475569;
}
</style>
