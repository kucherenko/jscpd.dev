<template>
  <div class="table-scroll">
    <table class="format-table">
      <thead>
        <tr><th>Format</th><th>Files</th><th>Lines</th><th>Clones</th><th>Duplicated lines</th><th>Duplication</th></tr>
      </thead>
      <tbody>
        <tr v-for="f in formats" :key="f.format">
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
</template>

<script setup lang="ts">
import type { RepoFormat } from '~/composables/useTrendingData'

defineProps<{ formats: RepoFormat[] }>()
</script>

<style scoped>
.table-scroll {
  overflow-x: auto;
  margin-top: 0.5rem;
}

.format-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.format-table th,
.format-table td {
  text-align: left;
  padding: 0.375rem 0.75rem;
  border-bottom: 1px solid var(--ui-border, rgba(100, 116, 139, 0.12));
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.format-table th {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}
</style>
