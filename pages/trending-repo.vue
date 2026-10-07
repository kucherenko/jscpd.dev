<script setup lang="ts">
import { computed } from 'vue'
import { codeMetric, hasTrendingRepo, latestTrendingDate, loadTrendingRepo } from '~/composables/useTrendingData'

definePageMeta({ layout: 'default', key: route => route.path })

const route = useRoute()
const name = `${route.params.owner}/${route.params.repo}`

if (!hasTrendingRepo(name)) {
  throw createError({ statusCode: 404, statusMessage: `${name} has not been analyzed`, fatal: true })
}

const { data, error } = await useAsyncData(`trending-repo-${name}`, () => loadTrendingRepo(name))
if (error.value || !data.value) {
  throw createError({ statusCode: 500, statusMessage: `Trending data for ${name} failed to load: ${error.value?.message ?? 'empty'}`, fatal: true })
}
const record = computed(() => data.value!)
const repo = computed(() => record.value.latest)
const code = computed(() => codeMetric(repo.value))
const latestAppearance = computed(() => record.value.appearances[record.value.appearances.length - 1]!)

// The change in code duplication between the first and the last code-measured
// appearance; shown only when there are two to compare.
const codeTrend = computed(() => {
  const measured = record.value.appearances.filter(a => a.codePercentage != null)
  if (measured.length < 2) return null
  const first = measured[0]!
  const last = measured[measured.length - 1]!
  return { first, last, delta: Math.round((last.codePercentage! - first.codePercentage!) * 100) / 100, count: measured.length }
})

const title = computed(() => `${repo.value.name}: duplicated code report`)
const description = computed(() => code.value
  ? `jscpd found ${code.value.percentage}% duplicated code in ${repo.value.name} (${num(code.value.sources)} code files, ${compact(code.value.lines)} lines, tests and generated files left out) `
    + `while it was trending on GitHub on ${formatDay(repo.value.date)}.`
  : `jscpd found ${num(repo.value.total.clones)} clones and ${repo.value.total.percentage}% duplicated lines in ${repo.value.name} `
    + `(${num(repo.value.total.sources)} files, ${compact(repo.value.total.lines)} lines) while it was trending on GitHub on ${formatDay(repo.value.date)}.`)

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
// The social card: the repo's number next to its name (components/OgImage/Trending.takumi.vue).
defineOgImage('Trending', {
  headline: `Trending, ${formatDay(repo.value.date, { month: 'short', day: 'numeric', year: 'numeric' })}`,
  title: repo.value.name,
  description: code.value
    ? `${num(code.value.sources)} code files, ${num(code.value.clones)} clones in code, ${repo.value.total.percentage}% duplicated over all files.`
    : `${num(repo.value.total.sources)} files, ${num(repo.value.total.clones)} clones, measured with jscpd.`,
  value: `${code.value ? code.value.percentage : repo.value.total.percentage}%`,
  label: code.value ? 'duplicated code' : 'duplicated, all files',
  tone: dupTone(code.value ? code.value.percentage : repo.value.total.percentage)
})
useHead({ link: [{ rel: 'canonical', href: `https://jscpd.dev${trendingRepoPath(name)}` }] })
</script>

<template>
  <div class="repo-page">
    <nav class="repo-breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/trending">Trending</NuxtLink>
      <span class="crumb-sep">/</span>
      <NuxtLink :to="trendingDayPath(repo.date, latestTrendingDate)">{{ formatDay(repo.date, { month: 'short', day: 'numeric', year: 'numeric' }) }}</NuxtLink>
      <span class="crumb-sep">/</span>
      <span>{{ repo.name }}</span>
    </nav>

    <header class="repo-hero">
      <h1 class="repo-title">
        <a :href="repo.url" target="_blank" rel="noopener">
          <Icon name="simple-icons:github" class="repo-title-icon" />{{ repo.name }}
        </a>
      </h1>
      <p v-if="repo.description" class="repo-desc">{{ repo.description }}</p>
      <div class="repo-chips">
        <span v-if="repo.language" class="chip">{{ repo.language }}</span>
        <span class="chip">★ {{ num(repo.stars) }}<span v-if="repo.starsToday" class="chip-delta">+{{ num(repo.starsToday) }} that day</span></span>
        <span class="chip">#{{ latestAppearance.rank }} on trending</span>
      </div>
      <p class="repo-meta">
        Analyzed {{ formatDay(repo.date) }} at
        <a :href="`${repo.url}/tree/${repo.headSha}`" target="_blank" rel="noopener"><code>{{ repo.headSha.slice(0, 7) }}</code></a>
        ({{ repo.defaultBranch }}) with <strong>jscpd {{ repo.jscpdVersion ?? 'v5' }}</strong> in {{ (repo.durationMs / 1000).toFixed(1) }}s.
        <template v-if="codeTrend">
          Code duplication
          <template v-if="codeTrend.delta === 0">stayed at {{ codeTrend.last.codePercentage }}% across {{ codeTrend.count }} appearances since {{ shortDay(codeTrend.first.date) }}.</template>
          <template v-else>went from {{ codeTrend.first.codePercentage }}% on {{ shortDay(codeTrend.first.date) }} to {{ codeTrend.last.codePercentage }}% on {{ shortDay(codeTrend.last.date) }}.</template>
        </template>
      </p>
    </header>

    <TrendingRepoDashboard :repo="repo" />

    <TrendingRepoDetails :repo="repo" />

    <section>
      <h2 class="detail-heading">Trending appearances</h2>
      <div class="table-scroll">
        <table class="detail-table">
          <thead>
            <tr><th>Day</th><th>Rank</th><th>Stars</th><th>Files</th><th>Lines</th><th>Clones</th><th>All files</th><th>Code</th><th>Health</th><th>Commit</th></tr>
          </thead>
          <tbody>
            <tr v-for="a in [...record.appearances].reverse()" :key="a.date">
              <td><NuxtLink :to="trendingDayPath(a.date, latestTrendingDate)">{{ formatDay(a.date, { month: 'short', day: 'numeric', year: 'numeric' }) }}</NuxtLink></td>
              <td>#{{ a.rank }}</td>
              <td>{{ num(a.stars) }}<span v-if="a.starsToday" class="muted"> (+{{ num(a.starsToday) }})</span></td>
              <td>{{ num(a.sources) }}</td>
              <td>{{ num(a.lines) }}</td>
              <td>{{ num(a.clones) }}</td>
              <td><span class="dup-badge" :class="dupClass(a.percentage)">{{ a.percentage }}%</span></td>
              <td>
                <span v-if="a.codePercentage != null" class="dup-badge" :class="dupClass(a.codePercentage)">{{ a.codePercentage }}%</span>
                <span v-else class="muted" :title="a.codeSources != null ? `${a.codeSources} code files, too few to quote` : 'No code-only scan that day'">—</span>
              </td>
              <td>
                <span v-if="a.healthScore != null" class="health-badge" :class="gradeClass(a.healthGrade)">{{ a.healthGrade }} {{ a.healthScore }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td><a :href="`${repo.url}/tree/${a.headSha}`" target="_blank" rel="noopener"><code>{{ a.headSha.slice(0, 7) }}</code></a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="repo-cta">
      Want this for your own project?
      <NuxtLink to="/start/installation">Install jscpd</NuxtLink> and run <code>jscpd .</code>, or
      <NuxtLink to="/trending#baselines">measure it the way the baselines were measured</NuxtLink>.
    </p>
  </div>
</template>

<style scoped>
.repo-page {
  max-width: 60rem;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.repo-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
}

.repo-breadcrumb a,
.repo-meta a,
.repo-cta a,
.detail-table a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.repo-breadcrumb a:hover,
.repo-meta a:hover,
.repo-cta a:hover,
.detail-table a:hover {
  text-decoration: underline;
}

.repo-hero {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.repo-title {
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.repo-title a {
  color: var(--ui-text-highlighted, inherit);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.repo-title a:hover {
  color: var(--jscpd-blue, #007bff);
}

.repo-title-icon {
  width: 0.8em;
  height: 0.8em;
  flex-shrink: 0;
}

.repo-desc {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ui-text-muted, #64748b);
}

.repo-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
}

.repo-meta {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
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

.muted {
  color: var(--ui-text-muted, #64748b);
}

.repo-cta {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}
</style>
