<template>
  <div class="table-scroll">
    <table class="week-table">
      <thead>
        <tr>
          <th>Repository</th>
          <th>Stars</th>
          <th>Days</th>
          <th>Code</th>
          <th>All files</th>
          <th>Largest finding</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in repos.slice(0, limit)" :key="r.name">
          <td class="week-repo">
            <NuxtLink :to="trendingRepoPath(r.name)">{{ r.name }}</NuxtLink>
            <span v-if="r.language" class="week-lang">{{ r.language }}</span>
          </td>
          <td>{{ compact(r.stars) }}<span v-if="r.starsToday" class="muted"> +{{ num(r.starsToday) }}</span></td>
          <td>{{ r.days }}</td>
          <td>
            <span v-if="r.code" class="dup-badge" :class="dupClass(r.code.percentage)">{{ r.code.percentage }}%</span>
            <span v-else class="muted" title="No code-only scan for this appearance">—</span>
          </td>
          <td><span class="muted">{{ r.total.percentage }}%</span></td>
          <td class="week-finding">
            <template v-if="r.topFinding">
              {{ r.topFinding.lines }} lines × {{ r.topFinding.copies }}
              <span v-if="r.topFinding.kind !== 'code'" class="chip">{{ kindLabel[r.topFinding.kind] }}</span>
              <span v-else class="chip">{{ r.topFinding.format }}</span>
            </template>
            <span v-else class="muted">none</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { WeekRepo } from '~/composables/useTrendingData'

withDefaults(defineProps<{ repos: WeekRepo[], limit?: number }>(), { limit: Infinity })
</script>

<style scoped>
.table-scroll {
  overflow-x: auto;
}

.week-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.week-table th,
.week-table td {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--ui-border, rgba(100, 116, 139, 0.12));
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  vertical-align: middle;
}

.week-table th {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.week-repo a {
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
  text-decoration: none;
}

.week-repo a:hover {
  color: var(--jscpd-blue, #007bff);
}

.week-lang {
  margin-left: 0.5rem;
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.week-finding {
  color: var(--ui-text-muted, #64748b);
}

.week-finding .chip {
  margin-left: 0.25rem;
}

.muted {
  color: var(--ui-text-muted, #64748b);
}
</style>
