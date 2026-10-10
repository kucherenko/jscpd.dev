<template>
  <div class="trending-list">
    <NuxtLink v-for="({ repo, code }, i) in rows" :key="repo.name" :to="trendingRepoPath(repo.name)" class="trending-row">
      <span class="trending-rank">{{ i + 1 }}</span>
      <span class="trending-main">
        <span class="trending-name">{{ owner(repo.name) }}/<wbr>{{ project(repo.name) }}</span>
        <span v-if="repo.description" class="trending-desc">{{ repo.description }}</span>
        <span class="trending-chips">
          <span v-if="repo.language" class="chip">{{ repo.language }}</span>
          <span class="chip">★ {{ num(repo.stars) }}<span v-if="repo.starsToday" class="chip-delta">+{{ num(repo.starsToday) }} today</span></span>
          <span v-if="code" class="chip">{{ num(code.sources) }} code files of {{ num(repo.total.sources) }}</span>
          <span v-else class="chip">{{ num(repo.total.sources) }} files</span>
          <span v-if="code?.generated.files" class="chip">{{ code.generated.files }} generated skipped</span>
        </span>
      </span>
      <span class="trending-side">
        <template v-if="code">
          <span class="dup-badge trending-pct" :class="dupClass(code.percentage)">{{ code.percentage }}%</span>
          <span class="trending-pct-label">duplicated code</span>
          <span class="trending-secondary">{{ repo.total.percentage }}% over all files</span>
        </template>
        <template v-else>
          <span class="dup-badge trending-pct" :class="dupClass(repo.total.percentage)">{{ repo.total.percentage }}%</span>
          <span class="trending-pct-label">duplicated, all files</span>
          <span class="trending-secondary">{{ num(repo.total.clones) }} clones</span>
        </template>
      </span>
      <Icon name="lucide:chevron-right" class="trending-chevron" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { codeMetric, type RepoAnalysis } from '~/composables/useTrendingData'

const props = defineProps<{ repos: RepoAnalysis[] }>()

const rows = computed(() => props.repos.map(repo => ({ repo, code: codeMetric(repo) })))
// The name breaks after the owner on a narrow screen, not in the middle of a word.
const owner = (name: string) => name.split('/')[0]
const project = (name: string) => name.split('/').slice(1).join('/')
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
  text-align: right;
}

.trending-pct {
  font-size: 1rem;
  padding: 0.25rem 0.75rem;
}

.trending-pct-label {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.trending-secondary {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
}

.trending-chevron {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--ui-text-muted, #64748b);
}

/* On a phone the row wraps: rank and text on top, the percentage with its
   label on a line of its own under the chips, and no chevron, the card is the
   link anyway. The text column then has the whole width for the name. */
@media (max-width: 480px) {
  .trending-row {
    flex-wrap: wrap;
    row-gap: 0.5rem;
  }

  .trending-main {
    flex-basis: calc(100% - 1.5rem - 0.875rem);
  }

  .trending-side {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding-left: calc(1.5rem + 0.875rem);
    text-align: left;
  }

  .trending-secondary,
  .trending-chevron {
    display: none;
  }
}
</style>
