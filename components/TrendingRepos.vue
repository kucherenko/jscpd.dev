<template>
  <div class="trending">
    <p class="trending-meta">
      Analyzed {{ formatDate(data.generatedAt) }} with <strong>jscpd v5</strong> —
      refreshed daily from <a href="https://github.com/trending" target="_blank" rel="noopener">GitHub trending</a>.
      Click a repository for detailed statistics.
    </p>

    <div class="trending-list">
      <div v-for="(repo, i) in data.repos" :key="repo.name" class="trending-item">
        <button class="trending-row" :aria-expanded="expanded === repo.name" @click="toggle(repo.name)">
          <span class="trending-rank">{{ i + 1 }}</span>
          <span class="trending-main">
            <span class="trending-name">{{ repo.name }}</span>
            <span v-if="repo.description" class="trending-desc">{{ repo.description }}</span>
            <span class="trending-chips">
              <span v-if="repo.language" class="chip">{{ repo.language }}</span>
              <span class="chip">★ {{ num(repo.stars) }}</span>
              <span v-if="repo.starsToday" class="chip chip-accent">+{{ num(repo.starsToday) }} today</span>
              <span class="chip">{{ num(repo.total.sources) }} files</span>
            </span>
          </span>
          <span class="trending-side">
            <span class="trending-clones">{{ num(repo.total.clones) }}</span>
            <span class="trending-clones-label">clones</span>
            <span class="dup-badge" :class="dupClass(repo.total.percentage)">{{ repo.total.percentage }}%</span>
          </span>
          <Icon name="lucide:chevron-down" class="trending-chevron" :class="{ open: expanded === repo.name }" />
        </button>

        <div v-if="expanded === repo.name" class="trending-details">
          <div class="detail-actions">
            <a :href="repo.url" target="_blank" rel="noopener" class="detail-link">
              <Icon name="simple-icons:github" class="detail-link-icon" /> {{ repo.name }}
            </a>
            <span class="detail-note">analyzed at <code>{{ repo.headSha.slice(0, 7) }}</code> in {{ (repo.durationMs / 1000).toFixed(1) }}s</span>
          </div>

          <div class="stat-grid">
            <div class="stat"><span class="stat-value">{{ num(repo.total.sources) }}</span><span class="stat-label">files</span></div>
            <div class="stat"><span class="stat-value">{{ num(repo.total.lines) }}</span><span class="stat-label">lines</span></div>
            <div class="stat"><span class="stat-value">{{ num(repo.total.tokens) }}</span><span class="stat-label">tokens</span></div>
            <div class="stat"><span class="stat-value">{{ num(repo.total.clones) }}</span><span class="stat-label">clones</span></div>
            <div class="stat"><span class="stat-value">{{ num(repo.total.duplicatedLines) }}</span><span class="stat-label">duplicated lines ({{ repo.total.percentage }}%)</span></div>
            <div class="stat"><span class="stat-value">{{ num(repo.total.duplicatedTokens) }}</span><span class="stat-label">duplicated tokens ({{ repo.total.percentageTokens }}%)</span></div>
          </div>

          <h4 class="detail-heading">By format</h4>
          <div class="table-scroll">
            <table class="detail-table">
              <thead>
                <tr><th>Format</th><th>Files</th><th>Lines</th><th>Clones</th><th>Duplication</th></tr>
              </thead>
              <tbody>
                <tr v-for="f in repo.formats" :key="f.format">
                  <td>{{ f.format }}</td>
                  <td>{{ num(f.sources) }}</td>
                  <td>{{ num(f.lines) }}</td>
                  <td>{{ num(f.clones) }}</td>
                  <td><span class="dup-badge" :class="dupClass(f.percentage)">{{ f.percentage }}%</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <template v-if="repo.topClones.length">
            <h4 class="detail-heading">Largest clones</h4>
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
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import data from '~/data/trending.json'

const expanded = ref<string | null>(null)
const toggle = (name: string) => { expanded.value = expanded.value === name ? null : name }

const num = (n: number) => typeof n === 'number' ? n.toLocaleString('en-US') : '—'
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const dupClass = (pct: number) => pct < 3 ? 'dup-low' : pct < 8 ? 'dup-mid' : 'dup-high'
// cross-format sources carry a block suffix (file.md:markdown, file.vue:script)
// that is not part of the real path
const cleanName = (name: string) => name.replace(/:[a-z][\w-]*$/, '')
const blobUrl = (repo: { url: string, headSha: string }, f: { name: string, start: number, end: number }) =>
  `${repo.url}/blob/${repo.headSha}/${cleanName(f.name)}#L${f.start}-L${f.end}`
</script>

<style scoped>
.trending {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trending-meta {
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
  margin: 0;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.trending-item {
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.trending-item:hover {
  border-color: rgba(0, 123, 255, 0.4);
}

.trending-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
}

.trending-rank {
  font-size: 0.8125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-muted, #64748b);
  width: 1.5rem;
  flex-shrink: 0;
  text-align: center;
}

.trending-main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.trending-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--ui-text-highlighted, inherit);
  overflow-wrap: anywhere;
}

.trending-desc {
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trending-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.chip {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  color: var(--ui-text-muted, #64748b);
  white-space: nowrap;
}

.chip-accent {
  color: var(--jscpd-blue, #007bff);
  border-color: rgba(0, 123, 255, 0.35);
}

.trending-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
  flex-shrink: 0;
}

.trending-clones {
  font-size: 1.125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-highlighted, inherit);
  line-height: 1;
}

.trending-clones-label {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.dup-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-variant-numeric: tabular-nums;
}

.dup-low { color: #16a34a; background: rgba(22, 163, 74, 0.12); }
.dup-mid { color: #d97706; background: rgba(217, 119, 6, 0.12); }
.dup-high { color: #dc2626; background: rgba(220, 38, 38, 0.12); }

.trending-chevron {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--ui-text-muted, #64748b);
  transition: transform 0.2s ease;
}

.trending-chevron.open {
  transform: rotate(180deg);
}

.trending-details {
  padding: 0 1rem 1rem;
  border-top: 1px solid var(--ui-border, rgba(100, 116, 139, 0.15));
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.875rem;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.detail-link-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.detail-note {
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.15));
  border-radius: 0.5rem;
}

.stat-value {
  font-size: 0.9375rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-highlighted, inherit);
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.detail-heading {
  margin: 0;
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

.clone-range {
  color: var(--ui-text-muted, #64748b);
}

.clone-sep {
  color: var(--ui-text-muted, #64748b);
}
</style>
