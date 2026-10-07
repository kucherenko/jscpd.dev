<template>
  <div class="baselines">
    <p class="baselines-intro">
      <template v-if="b.all">
        Code-only duplication of {{ b.repos }} repositories measured between {{ shortDay(b.from!) }} and {{ formatDay(b.to!, { month: 'short', day: 'numeric', year: 'numeric' }) }},
        each counted once at its latest appearance. Only repositories with at least {{ b.minCodeFiles }} code files count;
        a language gets its own row at {{ b.minRepos }} repositories.
      </template>
      <template v-else>
        No code-only measurements yet. The first ones arrive with the next daily analysis; a language gets its own row once {{ b.minRepos }} of its repositories were measured.
      </template>
    </p>

    <div v-if="b.all" class="table-scroll">
      <table class="baselines-table">
        <thead>
          <tr>
            <th>Language</th>
            <th>Repos</th>
            <th title="A quarter of the repositories have less duplication than this">Cleanest quarter</th>
            <th>Median</th>
            <th title="A quarter of the repositories have more duplication than this">Noisiest quarter</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in b.languages" :key="row.language">
            <td>{{ row.language }}</td>
            <td>{{ row.repos }}</td>
            <td><span class="dup-badge" :class="dupClass(row.p25)">{{ row.p25 }}%</span></td>
            <td><span class="dup-badge" :class="dupClass(row.median)">{{ row.median }}%</span></td>
            <td><span class="dup-badge" :class="dupClass(row.p75)">{{ row.p75 }}%</span></td>
          </tr>
          <tr class="baselines-all">
            <td>{{ b.all.language }}</td>
            <td>{{ b.all.repos }}</td>
            <td><span class="dup-badge" :class="dupClass(b.all.p25)">{{ b.all.p25 }}%</span></td>
            <td><span class="dup-badge" :class="dupClass(b.all.median)">{{ b.all.median }}%</span></td>
            <td><span class="dup-badge" :class="dupClass(b.all.p75)">{{ b.all.p75 }}%</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="b.pending.length" class="baselines-pending">
      Waiting for more repositories:
      <template v-for="(p, i) in b.pending" :key="p.language">{{ i ? ', ' : '' }}{{ p.language }} ({{ p.repos }} of {{ b.minRepos }})</template>.
    </p>

    <div v-if="b.all" class="standing">
      <h3 class="standing-heading">Where does your repository stand?</h3>
      <div class="standing-form">
        <label class="standing-field">
          <span class="standing-label">Language</span>
          <select v-model="language" class="standing-select">
            <option v-for="row in rows" :key="row.language" :value="row.language">{{ row.language }}</option>
          </select>
        </label>
        <label class="standing-field">
          <span class="standing-label">Your code duplication</span>
          <span class="standing-input-wrap">
            <input v-model.number="value" type="number" min="0" max="100" step="0.1" class="standing-input" inputmode="decimal">
            <span class="standing-unit">%</span>
          </span>
        </label>
      </div>
      <p v-if="result" class="standing-result">
        <template v-if="result.more === 0">Nothing we measured in {{ selected!.language }} has more duplication than {{ value }}%.</template>
        <template v-else-if="result.less === 0">Every {{ selected!.language }} repository we measured has more duplication than {{ value }}%.</template>
        <template v-else>{{ result.more }}% of the {{ selected!.language }} repositories we measured have more duplication than {{ value }}%, {{ result.less }}% have less.</template>
      </p>
      <p class="standing-how">To get a comparable number, run jscpd with the same config the pipeline uses:</p>
      <CopyCommand cmd="curl -fsSLO https://jscpd.dev/trending/code-only.jscpd.json && jscpd -c code-only.jscpd.json ." />
    </div>

    <details class="method">
      <summary>What the code-only scan leaves out</summary>
      <p class="method-text">
        Only programming-language formats are scanned ({{ b.method.format.length }} of the formats jscpd knows; no JSON, YAML, Markdown, CSS or HTML),
        files whose header says they were generated are skipped, and these paths are ignored:
      </p>
      <pre class="method-pre">{{ b.method.ignore.join('\n') }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { trendingBaselines } from '~/composables/useTrendingData'

const b = trendingBaselines
const rows = computed(() => b.all ? [...b.languages, b.all] : [])
const language = ref(rows.value[0]?.language ?? '')
const value = ref<number | ''>(5)
const selected = computed(() => rows.value.find(r => r.language === language.value) ?? null)
const result = computed(() => selected.value && typeof value.value === 'number' ? standing(selected.value.values, value.value) : null)
</script>

<style scoped>
.baselines {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.baselines-intro,
.baselines-pending,
.standing-how,
.method-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--ui-text-muted, #64748b);
}

.table-scroll {
  overflow-x: auto;
}

.baselines-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.baselines-table th,
.baselines-table td {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--ui-border, rgba(100, 116, 139, 0.12));
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.baselines-table th {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.baselines-all td {
  font-weight: 600;
  border-top: 2px solid var(--ui-border, rgba(100, 116, 139, 0.25));
}

.standing {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
}

.standing-heading {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.standing-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
}

.standing-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.standing-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.standing-select,
.standing-input {
  font: inherit;
  font-size: 0.875rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.5rem;
  background: transparent;
  color: var(--ui-text-highlighted, inherit);
}

.standing-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.standing-input {
  width: 6rem;
  font-variant-numeric: tabular-nums;
}

.standing-unit {
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}

.standing-result {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--ui-text-highlighted, inherit);
}

.standing :deep(.copy-command) {
  margin: 0;
}

.method summary {
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
}

.method-text {
  margin-top: 0.5rem;
}

.method-pre {
  margin: 0.5rem 0 0;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(100, 116, 139, 0.07);
  font-size: 0.6875rem;
  line-height: 1.5;
  max-height: 16rem;
  overflow: auto;
  column-count: 2;
  column-gap: 1.5rem;
}

@media (max-width: 640px) {
  .method-pre {
    column-count: 1;
  }
}
</style>
