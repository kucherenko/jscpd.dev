<template>
  <div class="dash">
    <div class="dash-health">
      <div class="dash-score">
        <span class="dash-grade" :class="gradeClass(repo.health!.grade)">{{ repo.health!.grade ?? '—' }}</span>
        <span class="dash-score-num">{{ repo.health!.score ?? '—' }}<span class="dash-score-max">/100</span></span>
      </div>
      <div class="dash-health-meta">
        <span class="dash-health-label">Project health</span>
        <span class="dash-health-size">{{ num(repo.health!.size.lines) }} lines of code ({{ repo.health!.size.class }})</span>
      </div>
    </div>

    <div class="dash-dims">
      <div v-for="d in dimensions" :key="d.id" class="dash-dim">
        <div class="dash-dim-head">
          <span class="dash-dim-name">{{ d.label }}</span>
          <span class="dash-dim-score">{{ d.score != null ? Math.round(d.score) : 'n/a' }}</span>
        </div>
        <div v-if="d.score != null" class="dash-bar">
          <div class="dash-bar-fill" :class="gradeBarClass(d.score)" :style="{ width: `${Math.max(2, Math.min(100, d.score))}%` }" />
        </div>
        <span class="dash-dim-hint">{{ d.hint }}</span>
      </div>
    </div>

    <div class="dash-grid">
      <section v-if="repo.complexity?.files.length" class="dash-panel">
        <h3 class="dash-panel-heading">Most complex files</h3>
        <ul class="dash-list">
          <li v-for="f in repo.complexity.files" :key="f.path" class="dash-list-row">
            <a :href="fileUrl(f.path)" target="_blank" rel="noopener" class="dash-list-name">{{ cleanName(f.path) }}</a>
            <span class="dash-list-value">{{ f.complexity }} <span class="dash-list-unit">cx</span></span>
          </li>
        </ul>
      </section>

      <section v-if="repo.deadCode" class="dash-panel">
        <h3 class="dash-panel-heading">
          Dead code
          <span class="dash-panel-hint">{{ repo.deadCode.percentage }}% unused · {{ repo.deadCode.findings }} findings</span>
        </h3>
        <ul v-if="repo.deadCode.largest.length" class="dash-list">
          <li v-for="(f, i) in repo.deadCode.largest" :key="i" class="dash-list-row">
            <a :href="fileUrl(f.path, f.line)" target="_blank" rel="noopener" class="dash-list-name">
              {{ cleanName(f.path) }}<span v-if="f.name">:{{ f.name }}</span>
            </a>
            <span class="chip">{{ f.category }}</span>
          </li>
        </ul>
        <p v-else class="dash-empty">No dead code found — everything here is reachable.</p>
      </section>
      <section v-else-if="deadCodeSkippedReason" class="dash-panel">
        <h3 class="dash-panel-heading">Dead code</h3>
        <p class="dash-empty">Not measured: {{ deadCodeSkippedReason }}.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RepoAnalysis } from '~/composables/useTrendingData'

const props = defineProps<{ repo: RepoAnalysis }>()

const gradeBarClass = (score: number) => score >= 85 ? 'grade-a' : score >= 70 ? 'grade-b' : score >= 55 ? 'grade-c' : score >= 40 ? 'grade-d' : 'grade-e'

const dimLabels: Record<string, string> = { duplication: 'Duplication', 'dead-code': 'Dead code', complexity: 'Complexity' }

// Fixed order regardless of which dimensions actually scored, so the three
// cards never reflow between repos; a skipped dimension still gets a card
// explaining why, matching the CLI's "dead code n/a" convention.
const dimensions = computed(() => {
  const byId = new Map((props.repo.health?.dimensions ?? []).map(d => [d.id, d]))
  const skippedById = new Map((props.repo.health?.skipped ?? []).map(s => [s.id, s.reason]))
  return ['duplication', 'dead-code', 'complexity'].map((id) => {
    const dim = byId.get(id)
    const reason = skippedById.get(id)
    return {
      id,
      label: dimLabels[id],
      score: dim ? Math.round(dim.score) : null,
      hint: dim
        ? (dim.formats?.length ? `${dim.value}% in ${dim.formats.join(', ')}` : `${dim.value}%`)
        : (reason ?? 'n/a')
    }
  })
})

const deadCodeSkippedReason = computed(() =>
  props.repo.health?.skipped?.find(s => s.id === 'dead-code')?.reason ?? null)

const fileUrl = (path: string, line?: number) => {
  const clean = cleanName(path)
  return `${props.repo.url}/blob/${props.repo.headSha}/${clean}${line ? `#L${line}` : ''}`
}
</script>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 1rem;
  background: var(--ui-bg-elevated, rgba(100, 116, 139, 0.03));
}

.dash-health {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dash-score {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-shrink: 0;
}

.dash-grade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  font-size: 1.25rem;
  font-weight: 800;
}

.dash-score-num {
  font-size: 1.75rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-highlighted, inherit);
  line-height: 1;
}

.dash-score-max {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ui-text-muted, #64748b);
}

.dash-health-meta {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.dash-health-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.dash-health-size {
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
}

.dash-dims {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.dash-dim {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.2));
  border-radius: 0.625rem;
}

.dash-dim-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.dash-dim-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.dash-dim-score {
  font-size: 0.875rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.dash-bar {
  height: 0.375rem;
  border-radius: 9999px;
  background: rgba(100, 116, 139, 0.15);
  overflow: hidden;
}

.dash-bar-fill {
  height: 100%;
  border-radius: 9999px;
}

.dash-bar-fill.grade-a { background: #27ae60; }
.dash-bar-fill.grade-b { background: #7cb342; }
.dash-bar-fill.grade-c { background: #f1c40f; }
.dash-bar-fill.grade-d { background: #f39c12; }
.dash-bar-fill.grade-e { background: #e74c3c; }

.dash-dim-hint {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.dash-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.dash-panel-heading {
  margin: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.dash-panel-hint {
  font-size: 0.6875rem;
  font-weight: 400;
  color: var(--ui-text-muted, #64748b);
}

.dash-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.dash-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.75rem;
}

.dash-list-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
}

.dash-list-name:hover {
  text-decoration: underline;
}

.dash-list-value {
  flex-shrink: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.dash-list-unit {
  font-weight: 400;
  color: var(--ui-text-muted, #64748b);
}

.dash-empty {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
}
</style>
