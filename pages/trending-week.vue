<script setup lang="ts">
import { computed } from 'vue'
import { hasTrendingWeek, latestTrendingDate, loadTrendingWeek, trendingWeeks } from '~/composables/useTrendingData'

definePageMeta({ layout: 'default', key: route => route.path })

const route = useRoute()
const week = route.params.week as string

if (!hasTrendingWeek(week)) {
  throw createError({ statusCode: 404, statusMessage: `No trending analysis for ${week}`, fatal: true })
}

const { data, error } = await useAsyncData(`trending-week-${week}`, () => loadTrendingWeek(week))
if (error.value || !data.value) {
  throw createError({ statusCode: 500, statusMessage: `Trending data for ${week} failed to load: ${error.value?.message ?? 'empty'}`, fatal: true })
}
const w = computed(() => data.value!)
const idx = trendingWeeks.findIndex(x => x.week === week)
const prev = trendingWeeks[idx - 1] ?? null
const next = trendingWeeks[idx + 1] ?? null

const coded = computed(() => w.value.summary.codeMedianPercentage != null)
const title = computed(() => `${weekTitle(week)}: trending repos measured`)
const description = computed(() => `${w.value.repos.length} GitHub trending repositories measured with jscpd during ${weekRange(w.value)}`
  + (coded.value ? `: median ${w.value.summary.codeMedianPercentage}% duplicated code.` : '.'))

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, twitterCard: 'summary_large_image' })
useHead({ link: [{ rel: 'canonical', href: `https://jscpd.dev${trendingWeekPath(week)}` }] })
// The social card: the week's median next to its title (components/OgImage/Trending.takumi.vue).
defineOgImage('Trending', {
  headline: `Trending, ${weekRange(w.value)}`,
  title: weekTitle(week),
  description: `${w.value.repos.length} GitHub trending repositories measured with jscpd during the week.`,
  value: `${coded.value ? w.value.summary.codeMedianPercentage : w.value.summary.medianPercentage}%`,
  label: coded.value ? 'median duplicated code' : 'median duplication, all files',
  tone: dupTone(coded.value ? w.value.summary.codeMedianPercentage! : w.value.summary.medianPercentage)
})

const tiles = computed(() => {
  const s = w.value.summary
  return [
    { label: 'repositories', value: String(w.value.repos.length), hint: `${w.value.days.length} analysis ${w.value.days.length === 1 ? 'day' : 'days'}` },
    ...(coded.value ? [
      { label: 'median code duplication', value: `${s.codeMedianPercentage}%`, hint: `${s.codeRepos} repos with a code-only scan` },
      { label: 'generated files skipped', value: String(s.generatedFiles ?? 0) }
    ] : []),
    { label: 'median duplication, all files', value: `${s.medianPercentage}%` },
    { label: 'clones found', value: compact(s.clones), hint: coded.value ? `${compact(s.codeClones)} in code` : undefined }
  ]
})
</script>

<template>
  <div class="week-page">
    <nav class="week-breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/trending">Trending</NuxtLink>
      <span class="crumb-sep">/</span>
      <span>{{ weekTitle(week) }}</span>
    </nav>

    <header class="week-hero">
      <h1 class="week-title">{{ weekTitle(week) }}</h1>
      <p class="week-sub">
        {{ weekRange(w) }}. Every repository that was on GitHub trending on one of the days below, measured with jscpd;
        a repository trending on several days appears once, with its last measurement.
      </p>
      <p class="week-days">
        Days:
        <template v-for="(d, i) in w.days" :key="d">{{ i ? ', ' : '' }}<NuxtLink :to="trendingDayPath(d, latestTrendingDate)">{{ shortDay(d) }}</NuxtLink></template>
      </p>
    </header>

    <div class="week-tiles">
      <div v-for="t in tiles" :key="t.label" class="week-tile">
        <span class="week-tile-value">{{ t.value }}</span>
        <span class="week-tile-label">{{ t.label }}</span>
        <span v-if="t.hint" class="week-tile-hint">{{ t.hint }}</span>
      </div>
    </div>

    <section>
      <h2 class="section-heading">Repositories</h2>
      <p class="section-note">
        Sorted by stars gained on their best day. The code column leaves out tests, docs, data, vendored and generated files;
        a dash means the appearance had no code-only scan or too few code files for one.
      </p>
      <TrendingWeekTable :repos="w.repos" />
    </section>

    <nav class="week-nav" aria-label="Other weeks">
      <NuxtLink v-if="prev" :to="trendingWeekPath(prev.week)" class="week-nav-link">← {{ weekTitle(prev.week) }}</NuxtLink>
      <span v-else />
      <NuxtLink v-if="next" :to="trendingWeekPath(next.week)" class="week-nav-link">{{ weekTitle(next.week) }} →</NuxtLink>
      <NuxtLink v-else to="/trending" class="week-nav-link">Latest day →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.week-page {
  max-width: 60rem;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.week-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
}

.week-breadcrumb a,
.week-days a,
.week-nav-link {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.week-breadcrumb a:hover,
.week-days a:hover,
.week-nav-link:hover {
  text-decoration: underline;
}

.week-hero {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.week-title {
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 800;
  line-height: 1.2;
  color: var(--ui-text-highlighted, inherit);
}

.week-sub,
.week-days,
.section-note {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--ui-text-muted, #64748b);
}

.week-days {
  font-size: 0.8125rem;
}

.week-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.625rem;
}

.week-tile {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
}

.week-tile-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--ui-text-highlighted, inherit);
  font-variant-numeric: tabular-nums;
}

.week-tile-label {
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.week-tile-hint {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
  opacity: 0.8;
}

.section-heading {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.section-note {
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.week-nav {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
}
</style>
