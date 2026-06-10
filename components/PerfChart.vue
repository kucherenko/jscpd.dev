<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const bars = [
  { label: 'fixtures', files: '548', size: '1.5 MB', v4: 1.03, v5: 0.03, speedup: '34.3x', v4Display: '1.03s', v5Display: '0.03s' },
  { label: 'Svelte', files: '8,963', size: '38 MB', v4: 15.80, v5: 0.43, speedup: '36.9x', v4Display: '15.80s', v5Display: '0.43s' },
  { label: 'CopilotKit', files: '17,092', size: '159 MB', v4: 82.89, v5: 3.44, speedup: '24.1x', v4Display: '82.89s', v5Display: '3.44s' },
]

const maxV4 = Math.max(...bars.map(b => b.v4))
const visible = ref(false)
const blameVisible = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const blameBars = [
  { label: 'without blame', v4Display: '1.03s', v5Display: '0.03s', v4Pct: 29, v5Pct: 23 },
  { label: 'with --blame', v4Display: '3.57s', v5Display: '0.13s', v4Pct: 100, v5Pct: 100 },
]

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        visible.value = true
        setTimeout(() => { blameVisible.value = true }, 300)
      }
    },
    { threshold: 0.2 }
  )
  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div ref="containerRef" class="perf-chart">
    <!-- Detection Speed -->
    <div class="perf-section">
      <h3 class="perf-section-title">Detection Speed</h3>
      <div class="perf-legend">
        <span class="perf-legend-item"><span class="perf-swatch swatch-v4" /> v4 (TypeScript)</span>
        <span class="perf-legend-item"><span class="perf-swatch swatch-v5" /> v5 (Rust)</span>
      </div>
      <div class="perf-bars">
        <div v-for="bar in bars" :key="bar.label" class="perf-row">
          <div class="perf-label">
            <span class="perf-label-name">{{ bar.label }}</span>
            <span class="perf-label-meta">{{ bar.files }} files · {{ bar.size }}</span>
          </div>
          <div class="perf-bar-group">
            <div class="perf-bar-track">
              <div
                class="perf-bar perf-bar-v4"
                :style="{ width: visible ? (bar.v4 / maxV4 * 100) + '%' : '0%' }"
              >
                <span class="perf-bar-value">{{ bar.v4Display }}</span>
              </div>
            </div>
            <div class="perf-bar-track">
              <div
                class="perf-bar perf-bar-v5"
                :style="{ width: visible ? Math.max((bar.v5 / maxV4 * 100), 2) + '%' : '0%' }"
              >
                <span class="perf-bar-value">{{ bar.v5Display }}</span>
              </div>
            </div>
          </div>
          <div class="perf-speedup">
            <span class="speedup-badge">{{ bar.speedup }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Git Blame Speed -->
    <div class="perf-section perf-section-alt">
      <h3 class="perf-section-title">Git Blame Speed <span class="perf-section-subtitle">(fixtures, 548 files)</span></h3>
      <div class="perf-blame-bars">
        <div v-for="bar in blameBars" :key="bar.label" class="perf-blame-row">
          <span class="perf-blame-label">{{ bar.label }}</span>
          <div class="perf-blame-group">
            <div class="perf-blame-track">
              <div class="perf-blame-bar perf-bar-v4" :style="{ width: blameVisible ? bar.v4Pct + '%' : '0%' }">
                <span class="perf-bar-value">{{ bar.v4Display }}</span>
              </div>
            </div>
            <div class="perf-blame-track">
              <div class="perf-blame-bar perf-bar-v5" :style="{ width: blameVisible ? bar.v5Pct + '%' : '0%' }">
                <span class="perf-bar-value">{{ bar.v5Display }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p class="perf-blame-note">
        v4 shells out to <code>git blame</code> per file. v5 uses <a href="https://github.com/GitoxideLabs/gitoxide" target="_blank" rel="noopener">gitoxide</a> in-process.
      </p>
    </div>

    <p class="perf-footer">Benchmarked on macOS (Apple Silicon) · 10 runs for fixtures/Svelte, 3 for CopilotKit · <a href="/getting-started/migration">Full benchmarks →</a></p>
  </div>
</template>

<style scoped>
.perf-chart {
  margin-top: 1rem;
}

.perf-section {
  margin-bottom: 1.5rem;
}

.perf-section-alt {
  background: rgba(var(--ui-color-primary-rgb), 0.03);
  border: 1px solid rgba(var(--ui-color-primary-rgb), 0.08);
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.perf-section-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: var(--ui-color-text);
}

.perf-section-subtitle {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--ui-color-neutral-500);
}

.perf-legend {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: var(--ui-color-neutral-500);
}

.perf-legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.perf-swatch {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.15rem;
}

.swatch-v4 { background: #f59e0b; }
.swatch-v5 { background: #10b981; }

.perf-bars {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.perf-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 0.75rem;
  align-items: center;
}

@media (max-width: 640px) {
  .perf-row {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}

.perf-label {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.perf-label-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--ui-color-text);
}

.perf-label-meta {
  font-size: 0.7rem;
  color: var(--ui-color-neutral-400);
}

.perf-bar-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.perf-bar-track {
  height: 1.5rem;
  background: rgba(var(--ui-color-neutral-rgb), 0.06);
  border-radius: 0.375rem;
  overflow: hidden;
  position: relative;
}

.perf-bar {
  height: 100%;
  border-radius: 0.375rem;
  transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  min-width: 0;
}

.perf-bar-v4 {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.perf-bar-v5 {
  background: linear-gradient(90deg, #10b981, #059669);
}

.perf-bar-value {
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.perf-bar-v5 .perf-bar-value {
  /* For very short v5 bars, push label outside */
}

.perf-speedup {
  display: flex;
  align-items: center;
  min-width: 60px;
  justify-content: center;
}

.speedup-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.15));
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.25);
  white-space: nowrap;
}

/* Blame section */
.perf-blame-bars {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.perf-blame-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.75rem;
  align-items: center;
}

@media (max-width: 640px) {
  .perf-blame-row {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}

.perf-blame-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--ui-color-neutral-500);
}

.perf-blame-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.perf-blame-track {
  height: 1.25rem;
  background: rgba(var(--ui-color-neutral-rgb), 0.06);
  border-radius: 0.25rem;
  overflow: hidden;
}

.perf-blame-bar {
  height: 100%;
  border-radius: 0.25rem;
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.4rem;
  min-width: 0;
}

.perf-blame-note {
  font-size: 0.7rem;
  color: var(--ui-color-neutral-400);
  margin: 0.75rem 0 0 0;
  line-height: 1.4;
}

.perf-blame-note code {
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
  border-radius: 0.2rem;
  background: rgba(var(--ui-color-neutral-rgb), 0.1);
}

.perf-blame-note a {
  color: var(--ui-color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.perf-footer {
  font-size: 0.7rem;
  color: var(--ui-color-neutral-400);
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
}

.perf-footer a {
  color: var(--ui-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.perf-footer a:hover {
  text-decoration: underline;
}
</style>