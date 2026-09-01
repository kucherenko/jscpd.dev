<template>
  <div class="trending-preview">
    <NuxtLink v-for="(repo, i) in top" :key="repo.name" to="/trending" class="preview-row">
      <span class="preview-rank">{{ i + 1 }}</span>
      <span class="preview-main">
        <span class="preview-name">{{ repo.name }}</span>
        <span class="preview-meta">
          <span v-if="repo.language">{{ repo.language }}</span>
          <span v-if="repo.language" class="preview-sep">·</span>
          <span>★ {{ num(repo.stars) }}</span>
        </span>
      </span>
      <span class="preview-side">
        <span class="preview-clones">{{ num(repo.total.clones) }} clones</span>
        <span class="dup-badge" :class="dupClass(repo.total.percentage)">{{ repo.total.percentage }}%</span>
      </span>
    </NuxtLink>

    <div class="preview-footer">
      <span class="preview-updated">Updated daily · {{ data.repos.length }} repos analyzed</span>
      <UButton
        to="/trending"
        color="primary"
        variant="soft"
        trailing-icon="i-lucide-arrow-right"
        label="See all trending repos"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import data from '~/data/trending.json'

const top = data.repos.slice(0, 5)
const num = (n: number) => typeof n === 'number' ? n.toLocaleString('en-US') : '—'
const dupClass = (pct: number) => pct < 3 ? 'dup-low' : pct < 8 ? 'dup-mid' : 'dup-high'
</script>

<style scoped>
.trending-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.625rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.preview-row:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 123, 255, 0.4);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.1);
}

.preview-rank {
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-muted, #64748b);
  width: 1.125rem;
  flex-shrink: 0;
  text-align: center;
}

.preview-main {
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
  flex: 1;
  min-width: 0;
}

.preview-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-meta {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.preview-sep {
  margin: 0 0.25rem;
}

.preview-side {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.preview-clones {
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-highlighted, inherit);
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

.preview-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.preview-updated {
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}
</style>
