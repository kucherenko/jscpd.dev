<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { speedData, BENCHMARK_HARDWARE } from '~/data/benchmarks'

const visible = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const logMin = Math.log10(50)
const logMax = Math.log10(50000)

function barWidth(timeMs: number): string {
  const logVal = Math.log10(timeMs)
  const pct = ((logVal - logMin) / (logMax - logMin)) * 100
  return Math.max(pct, 2) + '%'
}

function formatTime(ms: number): string {
  if (ms >= 1000) return (ms / 1000).toFixed(ms >= 10000 ? 0 : 1) + 's'
  return ms + 'ms'
}

const gridLines = computed(() => {
  const lines: { ms: number; label: string; pct: number }[] = []
  const scales = [
    { ms: 100, label: '100ms' },
    { ms: 1000, label: '1s' },
    { ms: 10000, label: '10s' },
    { ms: 30000, label: '30s' },
  ]
  for (const s of scales) {
    const logVal = Math.log10(s.ms)
    const pct = ((logVal - logMin) / (logMax - logMin)) * 100
    lines.push({ ms: s.ms, label: s.label, pct })
  }
  return lines
})

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        visible.value = true
      }
    },
    { threshold: 0.15 }
  )
  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div ref="containerRef" class="bench-speed">
    <div class="bench-speed-legend">
      <span
        v-for="tool in speedData"
        :key="tool.slug"
        class="bench-legend-item"
      >
        <span class="bench-swatch" :style="{ background: tool.color }" />
        {{ tool.tool }}
      </span>
    </div>

    <div class="bench-speed-chart">
      <div class="bench-speed-grid">
        <div
          v-for="line in gridLines"
          :key="line.ms"
          class="bench-grid-line"
          :style="{ left: line.pct + '%' }"
        >
          <span class="bench-grid-label">{{ line.label }}</span>
        </div>
      </div>

      <div
        v-for="(tool, idx) in speedData"
        :key="tool.slug"
        class="bench-speed-row"
      >
        <div class="bench-speed-label">
          <span class="bench-speed-name">{{ tool.tool }}</span>
          <span v-if="tool.note" class="bench-speed-note">{{ tool.note }}</span>
        </div>
        <div class="bench-speed-bar-track">
          <div
            class="bench-speed-bar"
            :style="{
              width: visible ? barWidth(tool.timeMs) : '0%',
              background: `linear-gradient(90deg, ${tool.color}, ${tool.color}cc)`,
              transitionDelay: visible ? idx * 80 + 'ms' : '0ms',
            }"
          >
            <span v-if="tool.timeMs >= 500" class="bench-speed-value">{{ formatTime(tool.timeMs) }}</span>
          </div>
          <span v-if="tool.timeMs < 500" class="bench-speed-value-outside" :style="{ left: barWidth(tool.timeMs) }">
            {{ formatTime(tool.timeMs) }}
          </span>
        </div>
        <div class="bench-speed-meta">
          <span class="bench-speed-files">{{ tool.files }} files</span>
          <span class="bench-speed-sep">&middot;</span>
          <span class="bench-speed-clones">{{ tool.clones }} clones</span>
          <span class="bench-speed-sep">&middot;</span>
          <span class="bench-speed-dup">{{ tool.dupLines.toLocaleString() }} dup lines</span>
        </div>
      </div>
    </div>

    <p class="bench-footer">
      Benchmarked on {{ BENCHMARK_HARDWARE }} &middot; Logarithmic scale &middot;
      <a href="https://github.com/kucherenko/jscpd/blob/master/benchmark/BENCHMARK.md" target="_blank" rel="noopener">Full methodology &rarr;</a>
    </p>
  </div>
</template>

<style scoped>
.bench-speed {
  margin-top: 1rem;
}

.bench-speed-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.7rem;
  color: var(--ui-color-neutral-500);
}

.bench-legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.bench-swatch {
  display: inline-block;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 0.15rem;
}

.bench-speed-chart {
  position: relative;
}

.bench-speed-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bench-grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(var(--ui-color-neutral-rgb), 0.08);
}

.bench-grid-label {
  position: absolute;
  bottom: 100%;
  left: 0;
  transform: translateX(-50%);
  font-size: 0.6rem;
  color: var(--ui-color-neutral-400);
  padding-bottom: 0.25rem;
  white-space: nowrap;
}

.bench-speed-row {
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.85rem;
  position: relative;
}

@media (max-width: 768px) {
  .bench-speed-row {
    grid-template-columns: 1fr;
    gap: 0.15rem;
    margin-bottom: 1.25rem;
  }
}

.bench-speed-label {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.bench-speed-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--ui-color-text);
}

.bench-speed-note {
  font-size: 0.65rem;
  color: var(--ui-color-neutral-400);
  font-style: italic;
  line-height: 1.3;
}

.bench-speed-bar-track {
  height: 2rem;
  background: rgba(var(--ui-color-neutral-rgb), 0.04);
  border-radius: 0.375rem;
  overflow: visible;
  position: relative;
}

.bench-speed-bar {
  height: 100%;
  border-radius: 0.375rem;
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  min-width: 0;
}

.bench-speed-value {
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.bench-speed-value-outside {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--ui-color-text);
  margin-left: 0.35rem;
  white-space: nowrap;
}

.bench-speed-meta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 170px;
  font-size: 0.65rem;
  color: var(--ui-color-neutral-400);
}

@media (max-width: 768px) {
  .bench-speed-meta {
    min-width: unset;
  }
}

.bench-speed-sep {
  color: var(--ui-color-neutral-300);
}

.bench-footer {
  font-size: 0.7rem;
  color: var(--ui-color-neutral-400);
  margin: 0.75rem 0 0 0;
  line-height: 1.4;
}

.bench-footer a {
  color: var(--ui-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.bench-footer a:hover {
  text-decoration: underline;
}
</style>