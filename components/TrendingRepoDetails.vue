<template>
  <div class="details">
    <div class="stat-grid">
      <div class="stat"><span class="stat-value">{{ num(repo.total.sources) }}</span><span class="stat-label">files</span></div>
      <div class="stat"><span class="stat-value">{{ num(repo.total.lines) }}</span><span class="stat-label">lines</span></div>
      <div class="stat"><span class="stat-value">{{ num(repo.total.tokens) }}</span><span class="stat-label">tokens</span></div>
      <div class="stat"><span class="stat-value">{{ num(repo.total.clones) }}</span><span class="stat-label">clones</span></div>
      <div class="stat"><span class="stat-value">{{ num(repo.total.duplicatedLines) }}</span><span class="stat-label">duplicated lines ({{ repo.total.percentage }}%)</span></div>
      <div class="stat"><span class="stat-value">{{ num(repo.total.duplicatedTokens) }}</span><span class="stat-label">duplicated tokens ({{ repo.total.percentageTokens }}%)</span></div>
    </div>

    <section>
      <h2 class="detail-heading">By format</h2>
      <div class="table-scroll">
        <table class="detail-table">
          <thead>
            <tr><th>Format</th><th>Files</th><th>Lines</th><th>Clones</th><th>Duplicated lines</th><th>Duplication</th></tr>
          </thead>
          <tbody>
            <tr v-for="f in repo.formats" :key="f.format">
              <td>{{ f.format }}</td>
              <td>{{ num(f.sources) }}</td>
              <td>{{ num(f.lines) }}</td>
              <td>{{ num(f.clones) }}</td>
              <td>{{ num(f.duplicatedLines) }}</td>
              <td><span class="dup-badge" :class="dupClass(f.percentage)">{{ f.percentage }}%</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="repo.topClones.length">
      <h2 class="detail-heading">Largest clones</h2>
      <ul class="clone-list">
        <li v-for="(c, ci) in repo.topClones" :key="ci" class="clone-item">
          <span class="clone-size">{{ c.lines }} lines · {{ num(c.tokens) }} tokens <span class="chip">{{ c.format }}</span></span>
          <span class="clone-files">
            <a :href="blobUrl(repo, c.firstFile)" target="_blank" rel="noopener">{{ cleanName(c.firstFile.name) }}<span class="clone-range">:{{ c.firstFile.start }}–{{ c.firstFile.end }}</span></a>
            <span class="clone-sep">⇆</span>
            <a :href="blobUrl(repo, c.secondFile)" target="_blank" rel="noopener">{{ cleanName(c.secondFile.name) }}<span class="clone-range">:{{ c.secondFile.start }}–{{ c.secondFile.end }}</span></a>
          </span>
        </li>
      </ul>
    </section>
    <p v-else class="detail-empty">No duplicated blocks found — nothing to show here.</p>
  </div>
</template>

<script setup lang="ts">
import type { RepoAnalysis } from '~/composables/useTrendingData'

defineProps<{ repo: RepoAnalysis }>()
</script>

<style scoped>
.details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.625rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ui-text-highlighted, inherit);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.detail-heading {
  margin: 0 0 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.table-scroll {
  overflow-x: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.detail-table th,
.detail-table td {
  text-align: left;
  padding: 0.375rem 0.75rem;
  border-bottom: 1px solid var(--ui-border, rgba(100, 116, 139, 0.12));
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.detail-table th {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.clone-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.clone-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.15));
  border-radius: 0.5rem;
  font-size: 0.75rem;
}

.clone-size {
  color: var(--ui-text-muted, #64748b);
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.clone-files {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.6875rem;
  overflow-wrap: anywhere;
}

.clone-files a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.clone-files a:hover {
  text-decoration: underline;
}

.clone-range,
.clone-sep {
  color: var(--ui-text-muted, #64748b);
}

.detail-empty {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}
</style>
