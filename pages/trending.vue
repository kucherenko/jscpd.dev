<script setup lang="ts">
import { computed } from 'vue'
import { hasTrendingDay, latestTrendingDate, loadTrendingDay, trendingHistory } from '~/composables/useTrendingData'

definePageMeta({ layout: 'default', key: route => route.path })

const route = useRoute()
const date = computed(() => (route.params.date as string | undefined) || latestTrendingDate)
const isLatest = computed(() => date.value === latestTrendingDate)

if (!hasTrendingDay(date.value)) {
  throw createError({ statusCode: 404, statusMessage: `No trending analysis for ${date.value}`, fatal: true })
}

const { data } = await useAsyncData(`trending-day-${date.value}`, () => loadTrendingDay(date.value))
const day = computed(() => data.value!)

const title = computed(() => isLatest.value
  ? 'Trending Repos, Analyzed'
  : `Trending Repos on ${formatDay(date.value, { month: 'short', day: 'numeric', year: 'numeric' })}`)
const description = computed(() => `jscpd analysis of ${day.value.summary.repos} GitHub trending repositories on ${formatDay(date.value)}: `
  + `${num(day.value.summary.clones)} clones and ${day.value.summary.percentage}% duplicated lines across ${compact(day.value.summary.lines)} lines of code.`)

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
useHead({ link: [{ rel: 'canonical', href: `https://jscpd.dev${trendingDayPath(date.value, latestTrendingDate)}` }] })
</script>

<template>
  <div class="trending-page">
    <section class="trending-hero">
      <h1 class="trending-title">
        Trending Repos, <span class="hero-gradient">Analyzed</span>
      </h1>
      <p class="trending-subtitle">
        How much duplicated code ships in GitHub's trending repositories?
        Every day a
        <a
          href="https://github.com/kucherenko/jscpd.dev/blob/master/.github/workflows/trending.yml"
          target="_blank"
          rel="noopener"
        >GitHub Actions pipeline</a>
        picks the day's trending repos, runs <strong>jscpd v5</strong> on each, and publishes the results here.
      </p>
      <div class="trending-nav">
        <TrendingDayNav :date="date" />
      </div>
      <p class="trending-hero-stats">
        Analyzed {{ formatDay(date) }} · {{ num(day.summary.clones) }} clones in {{ day.summary.repos }} repos
        <template v-if="!isLatest"> · <NuxtLink to="/trending">jump to latest</NuxtLink></template>
      </p>
    </section>

    <section class="trending-section">
      <h2 class="section-heading">Daily statistics</h2>
      <TrendingSummary :summary="day.summary" />
    </section>

    <section class="trending-section">
      <TrendingChart :days="trendingHistory.days" :selected="date" :latest="latestTrendingDate" />
    </section>

    <section class="trending-section">
      <h2 class="section-heading">Repositories</h2>
      <p class="section-note">
        Ranked as on <a href="https://github.com/trending" target="_blank" rel="noopener">GitHub trending</a> that day.
        Open a repository for its full statistics, per-format breakdown and largest duplicated blocks.
      </p>
      <TrendingRepos :repos="day.repos" />
    </section>

    <section v-if="day.summary.languages?.length" class="trending-section">
      <h2 class="section-heading">By language</h2>
      <div class="table-scroll">
        <table class="lang-table">
          <thead>
            <tr><th>Language</th><th>Repos</th><th>Lines</th><th>Clones</th><th>Duplicated lines</th><th>Duplication</th></tr>
          </thead>
          <tbody>
            <tr v-for="l in day.summary.languages" :key="l.language">
              <td>{{ l.language }}</td>
              <td>{{ l.repos }}</td>
              <td>{{ num(l.lines) }}</td>
              <td>{{ num(l.clones) }}</td>
              <td>{{ num(l.duplicatedLines) }}</td>
              <td><span class="dup-badge" :class="dupClass(l.percentage)">{{ l.percentage }}%</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.trending-page {
  max-width: 60rem;
  margin: 0 auto;
  padding: 0 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.trending-hero {
  text-align: center;
  padding: 4rem 0 0.5rem;
}

.trending-title {
  font-size: clamp(1.875rem, 5vw, 3rem);
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 1rem;
  color: var(--ui-text-highlighted, inherit);
}

.trending-subtitle {
  max-width: 42rem;
  margin: 0 auto;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ui-text-muted, #64748b);
}

.trending-subtitle a,
.trending-hero-stats a,
.section-note a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.trending-subtitle a:hover,
.trending-hero-stats a:hover,
.section-note a:hover {
  text-decoration: underline;
}

.trending-nav {
  margin-top: 1.5rem;
}

.trending-hero-stats {
  margin: 0.875rem 0 0;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
}

.section-heading {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.section-note {
  margin: -0.25rem 0 0.75rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}

.table-scroll {
  overflow-x: auto;
}

.lang-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.lang-table th,
.lang-table td {
  text-align: left;
  padding: 0.375rem 0.75rem;
  border-bottom: 1px solid var(--ui-border, rgba(100, 116, 139, 0.12));
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.lang-table th {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

@media (max-width: 640px) {
  .trending-hero {
    padding: 2.5rem 0 0.5rem;
  }
}
</style>
