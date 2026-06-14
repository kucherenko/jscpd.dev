<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { crossFormatData } from '~/data/benchmarks'

const visible = ref(false)
const containerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) visible.value = true
    },
    { threshold: 0.1 }
  )
  if (containerRef.value) observer.observe(containerRef.value)
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div ref="containerRef" class="bench-cross">
    <div class="bench-cross-section">
      <h4 class="bench-cross-subtitle">Within-Format Clones</h4>
      <p class="bench-cross-desc">Duplicates detected within the same file format.</p>
      <div class="bench-cross-table-wrap">
        <table class="bench-cross-table">
          <thead>
            <tr>
              <th>Tool</th>
              <th>Svelte &rarr; Svelte</th>
              <th>Astro &rarr; Astro</th>
              <th>Vue &rarr; Vue</th>
              <th>Markdown</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(tool, idx) in crossFormatData"
              :key="tool.slug"
              class="bench-cross-row"
              :class="{ 'bench-cross-row--visible': visible }"
              :style="{ transitionDelay: visible ? idx * 60 + 'ms' : '0ms' }"
            >
              <td>
                <span class="bench-tool-badge" :style="{ background: tool.color + '22', color: tool.color, borderColor: tool.color + '44' }">{{ tool.tool }}</span>
              </td>
              <td>{{ tool.withinFormat.svelte }}</td>
              <td>{{ tool.withinFormat.astro }}</td>
              <td>{{ tool.withinFormat.vue }}</td>
              <td>{{ tool.withinFormat.markdown }}</td>
              <td class="bench-cross-total">{{ tool.withinFormat.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bench-cross-section bench-cross-section--alt">
      <h4 class="bench-cross-subtitle">Cross-Format Clones (Svelte &harr; Astro)</h4>
      <p class="bench-cross-desc">Duplicates detected <strong>across</strong> different file formats &mdash; e.g., matching CSS blocks in both <code>.svelte</code> and <code>.astro</code> files.</p>
      <div class="bench-cross-cards">
        <div
          v-for="(tool, idx) in crossFormatData"
          :key="'cross-' + tool.slug"
          class="bench-cross-card"
          :class="{ 'bench-cross-card--visible': visible }"
          :style="{ transitionDelay: visible ? idx * 60 + 'ms' : '0ms', borderColor: tool.crossFormat.clones > 0 ? tool.color + '55' : undefined }"
        >
          <div class="bench-cross-card-header">
            <span class="bench-tool-badge" :style="{ background: tool.color + '22', color: tool.color, borderColor: tool.color + '44' }">{{ tool.tool }}</span>
          </div>
          <div v-if="tool.crossFormat.clones > 0" class="bench-cross-card-value">
            {{ tool.crossFormat.clones }} clone{{ tool.crossFormat.clones > 1 ? 's' : '' }}, {{ tool.crossFormat.lines }} lines
            <span class="bench-cross-card-detail">{{ tool.crossFormat.detail }}</span>
          </div>
          <div v-else-if="tool.slug === 'simian'" class="bench-cross-card-value bench-cross-card-value--partial">
            Reports aggregate blocks
            <span class="bench-cross-card-detail">Not per-language</span>
          </div>
          <div v-else class="bench-cross-card-value bench-cross-card-value--none">
            No cross-format detection
          </div>
        </div>
      </div>
    </div>

    <div class="bench-cross-section">
      <h4 class="bench-cross-subtitle">Markdown Embedded-Code Detection</h4>
      <p class="bench-cross-desc">Whether the tool detects duplicates <em>inside</em> embedded code blocks (TypeScript, Python, YAML) within Markdown files, rather than treating <code>.md</code> as flat text.</p>
      <div class="bench-cross-embedded">
        <div
          v-for="(tool, idx) in crossFormatData"
          :key="'md-' + tool.slug"
          class="bench-embedded-row"
          :class="{ 'bench-embedded-row--visible': visible }"
          :style="{ transitionDelay: visible ? idx * 60 + 'ms' : '0ms' }"
        >
          <span class="bench-tool-badge" :style="{ background: tool.color + '22', color: tool.color, borderColor: tool.color + '44' }">{{ tool.tool }}</span>
          <span class="bench-embedded-detail">
            <template v-if="tool.embeddedLangs && tool.embeddedLangs.length">
              <span v-for="(lang, li) in tool.embeddedLangs" :key="lang" class="bench-embedded-lang">
                {{ lang }}<template v-if="li < tool.embeddedLangs!.length - 1">, </template>
              </span>
            </template>
            <template v-else>{{ tool.embeddedCode }}</template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bench-cross {
  margin-top: 1rem;
}

.bench-cross-section {
  margin-bottom: 2rem;
}

.bench-cross-section--alt {
  background: rgba(var(--ui-color-primary-rgb), 0.03);
  border: 1px solid rgba(var(--ui-color-primary-rgb), 0.08);
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.bench-cross-subtitle {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--ui-color-text);
}

.bench-cross-desc {
  font-size: 0.75rem;
  color: var(--ui-color-neutral-500);
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.bench-cross-desc code {
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
  border-radius: 0.2rem;
  background: rgba(var(--ui-color-neutral-rgb), 0.1);
}

.bench-cross-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.bench-cross-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.bench-cross-table th {
  text-align: left;
  padding: 0.5rem;
  font-weight: 600;
  color: var(--ui-color-neutral-500);
  border-bottom: 1px solid rgba(var(--ui-color-neutral-rgb), 0.1);
  font-size: 0.7rem;
  white-space: nowrap;
}

.bench-cross-table td {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(var(--ui-color-neutral-rgb), 0.05);
  color: var(--ui-color-text);
  white-space: nowrap;
}

.bench-cross-total {
  font-weight: 700;
}

.bench-cross-row {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.bench-cross-row--visible {
  opacity: 1;
  transform: translateY(0);
}

.bench-tool-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
}

.bench-cross-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.bench-cross-card {
  border: 1px solid rgba(var(--ui-color-neutral-rgb), 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.bench-cross-card--visible {
  opacity: 1;
  transform: scale(1);
}

.bench-cross-card-header {
  margin-bottom: 0.5rem;
}

.bench-cross-card-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ui-color-text);
}

.bench-cross-card-detail {
  display: block;
  font-size: 0.65rem;
  font-weight: 400;
  color: var(--ui-color-neutral-400);
  margin-top: 0.1rem;
}

.bench-cross-card-value--none {
  color: var(--ui-color-neutral-400);
  font-weight: 400;
  font-size: 0.75rem;
  font-style: italic;
}

.bench-cross-card-value--partial {
  color: var(--ui-color-neutral-500);
  font-weight: 500;
}

.bench-cross-embedded {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bench-embedded-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(var(--ui-color-neutral-rgb), 0.05);
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.bench-embedded-row--visible {
  opacity: 1;
  transform: translateX(0);
}

.bench-embedded-detail {
  font-size: 0.75rem;
  color: var(--ui-color-neutral-500);
  line-height: 1.4;
}

.bench-embedded-lang {
  font-weight: 500;
  color: var(--ui-color-text);
}

@media (max-width: 768px) {
  .bench-cross-table {
    font-size: 0.65rem;
  }

  .bench-cross-cards {
    grid-template-columns: 1fr;
  }

  .bench-embedded-row {
    flex-direction: column;
    gap: 0.15rem;
  }
}
</style>