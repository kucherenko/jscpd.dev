<template>
  <div class="details">
    <p v-if="code" class="left-out">
      The code number leaves out tests, fixtures, docs, examples, data files, styles, translations and vendored code<template v-if="!code.generated.files">.</template>
      <template v-else>, and {{ code.generated.files }} generated {{ code.generated.files === 1 ? 'file' : 'files' }}:
        <code v-for="(f, i) in code.generated.sample" :key="f">{{ i ? ', ' : '' }}{{ f }}</code><template v-if="code.generated.files > code.generated.sample.length"> and {{ code.generated.files - code.generated.sample.length }} more</template>.
      </template>
    </p>
    <p v-else-if="repo.code" class="left-out">
      Only {{ num(repo.code.sources) }} of the files count as code, too few for a code-only percentage; the numbers above cover every file.
    </p>
    <p v-else class="left-out">
      Measured over every file: this day was analyzed before the code-only scan existed, so tests, data and generated files are in these numbers and the copy counts below are lower bounds.
    </p>

    <section>
      <h2 class="detail-heading">{{ scope === 'code' ? 'Largest clones in the code' : 'Largest clones' }}</h2>
      <TrendingFindings v-if="findings.length" :findings="findings" :repo="repo" :limit="3" />
      <p v-else class="detail-empty">No duplicated blocks found.</p>
      <details v-if="findings.length > 3" class="more">
        <summary>{{ findings.length - 3 }} more</summary>
        <TrendingFindings :findings="findings.slice(3)" :repo="repo" :limit="10" class="more-list" />
      </details>
    </section>

    <details v-if="scope === 'code' && repo.topClones.length" class="more">
      <summary>Largest clones over all files, tests and data included</summary>
      <TrendingFindings :findings="repo.topClones" :repo="repo" :limit="5" class="more-list" />
    </details>

    <details v-if="repo.code?.formats.length" class="more">
      <summary>By format, code only</summary>
      <TrendingFormatTable :formats="repo.code.formats" />
    </details>
    <details class="more">
      <summary>By format, all files</summary>
      <TrendingFormatTable :formats="repo.formats" />
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { codeMetric, type RepoAnalysis } from '~/composables/useTrendingData'

const props = defineProps<{ repo: RepoAnalysis }>()

const code = computed(() => codeMetric(props.repo))
// The code scan's findings are the ones worth a look even when the scan is
// too narrow to quote a percentage for; the raw list is the fallback.
const scope = computed(() => props.repo.code?.topClones.length ? 'code' : 'all')
const findings = computed(() => scope.value === 'code' ? props.repo.code!.topClones : props.repo.topClones)
</script>

<style scoped>
.details {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.left-out {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--ui-text-muted, #64748b);
}

.left-out code {
  font-size: 0.75rem;
}

.detail-heading {
  margin: 0 0 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.detail-empty {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}

.more summary {
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
}

.more summary:hover {
  color: var(--jscpd-blue, #007bff);
}

.more-list {
  margin-top: 0.75rem;
}
</style>
