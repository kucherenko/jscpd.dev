<template>
  <div class="trending-list">
    <NuxtLink v-for="(repo, i) in repos" :key="repo.name" :to="trendingRepoPath(repo.name)" class="trending-row">
      <span class="trending-rank">{{ i + 1 }}</span>
      <span class="trending-main">
        <span class="trending-name">{{ repo.name }}</span>
        <span v-if="repo.description" class="trending-desc">{{ repo.description }}</span>
        <span class="trending-chips">
          <span v-if="repo.language" class="chip">{{ repo.language }}</span>
          <span class="chip">★ {{ num(repo.stars) }}</span>
          <span v-if="repo.starsToday" class="chip chip-accent">+{{ num(repo.starsToday) }} today</span>
          <span class="chip">{{ num(repo.total.sources) }} files</span>
          <span class="chip">{{ compact(repo.total.lines) }} lines</span>
        </span>
      </span>
      <span class="trending-side">
        <span class="trending-clones">{{ num(repo.total.clones) }}</span>
        <span class="trending-clones-label">clones</span>
        <span class="dup-badge" :class="dupClass(repo.total.percentage)">{{ repo.total.percentage }}%</span>
      </span>
      <Icon name="lucide:chevron-right" class="trending-chevron" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { RepoAnalysis } from '~/composables/useTrendingData'

defineProps<{ repos: RepoAnalysis[] }>()
</script>

<style scoped>
.trending-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.trending-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.trending-row:hover {
  border-color: rgba(0, 123, 255, 0.4);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.08);
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

.trending-chevron {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--ui-text-muted, #64748b);
}
</style>
