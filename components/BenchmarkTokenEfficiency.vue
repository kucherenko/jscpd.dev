<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { tokenData } from '~/data/benchmarks'

const visible = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const maxTokens = Math.max(...tokenData.map(t => t.estTokens))

const aiReady = computed(() => tokenData.filter(t => t.llmReady === 'yes'))
const partialReady = computed(() => tokenData.filter(t => t.llmReady === 'partial'))
const notReady = computed(() => tokenData.filter(t => t.llmReady === 'no'))

const sections = computed(() => [
  { title: 'LLM-Ready Output', desc: 'Compact formats designed for LLM context windows', items: aiReady.value, badgeColor: '#10b981' },
  { title: 'Partially Usable', desc: 'Structured but limited coverage or verbose output', items: partialReady.value, badgeColor: '#f59e0b' },
  { title: 'Not LLM-Ready', desc: 'Verbose or unstructured output; not suitable for LLM context windows', items: notReady.value, badgeColor: '#94a3b8' },
])

function barWidth(tokens: number): string {
  return Math.max((tokens / maxTokens) * 100, 1.5) + '%'
}

function formatTokens(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k'
  return n.toLocaleString()
}

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
  <div ref="containerRef" class="bench-token">
    <div
      v-for="(section, sIdx) in sections"
      :key="section.title"
      class="bench-token-section"
    >
      <div class="bench-token-header">
        <span
          class="bench-token-badge"
          :style="{ background: section.badgeColor + '22', color: section.badgeColor, borderColor: section.badgeColor + '44' }"
        >{{ section.title }}</span>
      </div>
      <p class="bench-token-desc">{{ section.desc }}</p>

      <div
        v-for="(tool, tIdx) in section.items"
        :key="tool.slug"
        class="bench-token-row"
        :style="{ transitionDelay: visible ? (sIdx * 150 + tIdx * 60) + 'ms' : '0ms' }"
        :class="{ 'bench-token-row--visible': visible }"
      >
        <div class="bench-token-label">
          <span class="bench-token-tool">{{ tool.tool }}</span>
          <span class="bench-token-format">{{ tool.format }}</span>
        </div>
        <div class="bench-token-bar-track">
          <div
            class="bench-token-bar"
            :style="{ width: visible ? barWidth(tool.estTokens) : '0%', background: `linear-gradient(90deg, ${tool.color}, ${tool.color}aa)`, transitionDelay: visible ? (sIdx * 150 + tIdx * 60) + 'ms' : '0ms' }"
          >
            <span v-if="tool.estTokens >= 5000" class="bench-token-value">{{ formatTokens(tool.estTokens) }} tokens</span>
          </div>
          <span v-if="tool.estTokens < 5000" class="bench-token-value-outside" :style="{ left: barWidth(tool.estTokens) }">{{ formatTokens(tool.estTokens) }} tokens</span>
        </div>
        <div class="bench-token-stats">
          <span>{{ tool.clones }} clones</span>
          <span class="bench-token-sep">&middot;</span>
          <span>{{ tool.tokensPerClone }} tok/clone</span>
        </div>
        <div v-if="tool.caveat" class="bench-token-caveat">
          <span class="i-lucide-alert-triangle bench-caveat-icon" />
          {{ tool.caveat }}
        </div>
      </div>
    </div>

    <div class="bench-token-note">
      <span class="i-lucide-info bench-note-icon" />
      <p><strong>Tokens/clone is not directly comparable across tools.</strong> Each tool defines "clone" differently &mdash; jscpd uses token-based code blocks, Duplo reports text matches (many false positives), Simian reports aggregate blocks, PMD CPD only processes 34 of 547 files, and Fallow only handles JS/TS. Compare within the same category for meaningful results.</p>
    </div>
  </div>
</template>

<style scoped>
.bench-token {
  margin-top: 1rem;
}

.bench-token-section {
  margin-bottom: 2rem;
}

.bench-token-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.15rem;
}

.bench-token-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid;
}

.bench-token-desc {
  font-size: 0.75rem;
  color: var(--ui-color-neutral-500);
  margin: 0 0 0.75rem 0;
}

.bench-token-row {
  margin-bottom: 0.6rem;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.bench-token-row--visible {
  opacity: 1;
  transform: translateY(0);
}

.bench-token-label {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.15rem;
}

.bench-token-tool {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--ui-color-text);
}

.bench-token-format {
  font-size: 0.65rem;
  color: var(--ui-color-neutral-400);
}

.bench-token-bar-track {
  height: 1.75rem;
  background: rgba(var(--ui-color-neutral-rgb), 0.04);
  border-radius: 0.25rem;
  overflow: visible;
  position: relative;
  margin-bottom: 0.15rem;
}

.bench-token-bar {
  height: 100%;
  border-radius: 0.25rem;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.4rem;
  min-width: 0;
}

.bench-token-value {
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.bench-token-value-outside {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--ui-color-text);
  margin-left: 0.35rem;
  white-space: nowrap;
}

.bench-token-stats {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: var(--ui-color-neutral-400);
  margin-bottom: 0.15rem;
}

.bench-token-sep {
  color: var(--ui-color-neutral-300);
}

.bench-token-caveat {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  font-size: 0.65rem;
  color: var(--ui-color-neutral-400);
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 0.25rem;
  padding: 0.3rem 0.5rem;
  line-height: 1.4;
}

.bench-caveat-icon {
  width: 0.85rem;
  height: 0.85rem;
  flex-shrink: 0;
  color: #f59e0b;
  margin-top: 0.05rem;
}

.bench-token-note {
  display: flex;
  gap: 0.5rem;
  background: rgba(var(--ui-color-primary-rgb), 0.04);
  border: 1px solid rgba(var(--ui-color-primary-rgb), 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
}

.bench-note-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--ui-color-primary);
  margin-top: 0.1rem;
}

.bench-token-note p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ui-color-neutral-500);
  line-height: 1.5;
}

@media (max-width: 640px) {
  .bench-token-value-outside {
    font-size: 0.6rem;
  }
}
</style>