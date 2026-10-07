<script setup lang="ts">
import { computed } from 'vue'
import {
  hasTrendingDay, latestTrendingDate, latestTrendingWeek, loadTrendingDay, loadTrendingWeek, trendingBaselines, trendingHistory, trendingWeeks
} from '~/composables/useTrendingData'

definePageMeta({ layout: 'default', key: route => route.path })

const route = useRoute()
const date = computed(() => (route.params.date as string | undefined) || latestTrendingDate)
const isLatest = computed(() => date.value === latestTrendingDate)

if (!hasTrendingDay(date.value)) {
  throw createError({ statusCode: 404, statusMessage: `No trending analysis for ${date.value}`, fatal: true })
}

const { data, error } = await useAsyncData(`trending-day-${date.value}`, () => loadTrendingDay(date.value))
if (error.value || !data.value) {
  throw createError({ statusCode: 500, statusMessage: `Trending data for ${date.value} failed to load: ${error.value?.message ?? 'empty'}`, fatal: true })
}
const day = computed(() => data.value!)

// The week block is for the latest page only; archive days keep to themselves.
const weekId = isLatest.value ? latestTrendingWeek : null
const { data: weekData } = await useAsyncData(`trending-week-${weekId}`, () => weekId ? loadTrendingWeek(weekId) : Promise.resolve(null))
const week = computed(() => weekData.value)
const weekIndex = computed(() => trendingWeeks.find(w => w.week === weekId) ?? null)

const coded = computed(() => day.value.summary.codeMedianPercentage != null)
const title = computed(() => isLatest.value
  ? 'Trending Repos, Analyzed'
  : `Trending Repos on ${formatDay(date.value, { month: 'short', day: 'numeric', year: 'numeric' })}`)
const description = computed(() => {
  const s = day.value.summary
  return `jscpd analysis of ${s.repos} GitHub trending repositories on ${formatDay(date.value)}: `
    + (coded.value
      ? `median ${s.codeMedianPercentage}% duplicated code once tests, docs, data and generated files are left out.`
      : `${num(s.clones)} clones and ${s.percentage}% duplicated lines across ${compact(s.lines)} lines.`)
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
// The social card: the day's median next to the title (components/OgImage/Trending.takumi.vue).
defineOgImage('Trending', {
  headline: isLatest.value ? 'Trending today' : `Trending, ${formatDay(date.value, { month: 'short', day: 'numeric', year: 'numeric' })}`,
  title: 'Trending Repos, Analyzed',
  description: `${day.value.summary.repos} GitHub trending repositories measured with jscpd on ${formatDay(date.value)}: every file, and the code alone.`,
  value: `${coded.value ? day.value.summary.codeMedianPercentage : day.value.summary.medianPercentage}%`,
  label: coded.value ? 'median duplicated code' : 'median duplication, all files',
  tone: dupTone(coded.value ? day.value.summary.codeMedianPercentage! : day.value.summary.medianPercentage)
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
        Every day a
        <a
          href="https://github.com/kucherenko/jscpd.dev/blob/master/.github/workflows/trending.yml"
          target="_blank"
          rel="noopener"
        >GitHub Actions pipeline</a>
        takes the day's <a href="https://github.com/trending" target="_blank" rel="noopener">GitHub trending</a> repositories and runs
        <strong>jscpd</strong> on each one twice: over every file, and over the code alone, without tests, docs, data, vendored and
        generated files. The code number is the one worth comparing. The all-files number mostly says how much copied or generated material a repository carries.
      </p>
      <div class="trending-nav">
        <TrendingDayNav :date="date" />
      </div>
      <p class="trending-hero-stats">
        {{ formatDay(date) }} · {{ day.summary.repos }} repos
        <template v-if="coded"> · median {{ day.summary.codeMedianPercentage }}% duplicated code</template>
        <template v-else> · {{ num(day.summary.clones) }} clones, all files</template>
        <template v-if="!isLatest"> · <NuxtLink to="/trending">jump to latest</NuxtLink></template>
      </p>
    </section>

    <p v-if="!isLatest && !coded" class="archive-note">
      Archive day. Measured over every file: tests, data and generated files are in these numbers.
      Code-only measurements start on {{ trendingBaselines.from ? formatDay(trendingBaselines.from) : 'the days that follow' }}.
    </p>

    <section class="trending-section">
      <h2 class="section-heading">Repositories</h2>
      <p class="section-note">
        Ranked as on GitHub trending that day. Open a repository for the largest duplicated blocks with the code, every day it trended, and the per-format breakdown.
      </p>
      <TrendingRepos :repos="day.repos" />
    </section>

    <section v-if="isLatest" class="trending-section">
      <h2 class="section-heading">Typical duplication by language</h2>
      <TrendingBaselines />
    </section>

    <section v-if="week && weekIndex" class="trending-section">
      <h2 class="section-heading">This week</h2>
      <p class="section-note">
        {{ weekTitle(week.week) }}, {{ weekRange(week) }}: {{ week.repos.length }} repositories so far<template v-if="week.summary.codeMedianPercentage != null">,
          median {{ week.summary.codeMedianPercentage }}% duplicated code across the {{ week.summary.codeRepos }} with a code-only scan</template>.
      </p>
      <TrendingWeekTable :repos="week.repos" :limit="6" />
      <p class="section-more">
        <NuxtLink :to="trendingWeekPath(week.week)">The whole week<template v-if="week.repos.length > 6"> ({{ week.repos.length }} repositories)</template> →</NuxtLink>
        <template v-if="trendingWeeks.length > 1">
          · earlier:
          <template v-for="(w, i) in [...trendingWeeks].reverse().slice(1, 5)" :key="w.week">{{ i ? ', ' : ' ' }}<NuxtLink :to="trendingWeekPath(w.week)">{{ weekTitle(w.week) }}</NuxtLink></template>
        </template>
      </p>
    </section>

    <details class="trending-section stats-details">
      <summary class="stats-summary">
        <Icon name="lucide:chevron-right" class="stats-chevron" />
        <span class="section-heading stats-heading">Statistics for the day</span>
        <span class="stats-teaser">{{ compact(day.summary.lines) }} lines · {{ num(day.summary.clones) }} clones · {{ day.summary.percentage }}% duplicated over all files</span>
      </summary>
      <div class="stats-body">
        <TrendingSummary :summary="day.summary" />
      </div>
    </details>

    <section class="trending-section">
      <TrendingChart :days="trendingHistory.days" :selected="date" :latest="latestTrendingDate" />
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
  gap: 2.25rem;
}

.trending-hero {
  text-align: center;
  padding: 4rem 0 0;
}

.trending-title {
  font-size: clamp(1.875rem, 5vw, 3rem);
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 1rem;
  color: var(--ui-text-highlighted, inherit);
}

.trending-subtitle {
  max-width: 44rem;
  margin: 0 auto;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ui-text-muted, #64748b);
}

.trending-subtitle a,
.trending-hero-stats a,
.section-note a,
.section-more a,
.archive-note a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.trending-subtitle a:hover,
.trending-hero-stats a:hover,
.section-note a:hover,
.section-more a:hover,
.archive-note a:hover {
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

.archive-note {
  margin: -1rem 0 0;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(217, 119, 6, 0.35);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ui-text-muted, #64748b);
}

.section-heading {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.stats-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.stats-summary::-webkit-details-marker {
  display: none;
}

.stats-heading {
  margin: 0;
}

.stats-chevron {
  width: 1rem;
  height: 1rem;
  color: var(--ui-text-muted, #64748b);
  transition: transform 0.2s ease;
}

.stats-details[open] .stats-chevron {
  transform: rotate(90deg);
}

.stats-teaser {
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
}

.stats-summary:hover .stats-heading {
  color: var(--jscpd-blue, #007bff);
}

.stats-body {
  margin-top: 0.75rem;
}

.section-note {
  margin: -0.25rem 0 0.75rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--ui-text-muted, #64748b);
}

.section-more {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}

@media (max-width: 640px) {
  .trending-hero {
    padding: 2.5rem 0 0;
  }
}
</style>
