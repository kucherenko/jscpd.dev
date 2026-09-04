<script setup lang="ts">
import { computed } from 'vue'
import { hasTrendingRepo, latestTrendingDate, loadTrendingRepo } from '~/composables/useTrendingData'

definePageMeta({ layout: 'default', key: route => route.path })

const route = useRoute()
const name = `${route.params.owner}/${route.params.repo}`

if (!hasTrendingRepo(name)) {
  throw createError({ statusCode: 404, statusMessage: `${name} has not been analyzed`, fatal: true })
}

const { data } = await useAsyncData(`trending-repo-${name}`, () => loadTrendingRepo(name))
const record = computed(() => data.value!)
const repo = computed(() => record.value.latest)
const latestAppearance = computed(() => record.value.appearances[record.value.appearances.length - 1]!)

const title = computed(() => `${repo.value.name}: duplicated code report`)
const description = computed(() => `jscpd found ${num(repo.value.total.clones)} clones and ${repo.value.total.percentage}% duplicated lines in ${repo.value.name} `
  + `(${num(repo.value.total.sources)} files, ${compact(repo.value.total.lines)} lines) while it was trending on GitHub on ${formatDay(repo.value.date)}.`)

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
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
        <span class="chip">★ {{ num(repo.stars) }}</span>
        <span v-if="repo.starsToday" class="chip chip-accent">+{{ num(repo.starsToday) }} that day</span>
        <span class="chip">#{{ latestAppearance.rank }} on trending</span>
        <span class="dup-badge" :class="dupClass(repo.total.percentage)">{{ repo.total.percentage }}% duplicated</span>
      </div>
      <p class="repo-meta">
        Analyzed {{ formatDay(repo.date) }} at
        <a :href="`${repo.url}/tree/${repo.headSha}`" target="_blank" rel="noopener"><code>{{ repo.headSha.slice(0, 7) }}</code></a>
        ({{ repo.defaultBranch }}) with <strong>jscpd v5</strong> in {{ (repo.durationMs / 1000).toFixed(1) }}s.
      </p>
    </header>

    <TrendingRepoDetails :repo="repo" />

    <section>
      <h2 class="detail-heading">Trending appearances</h2>
      <div class="table-scroll">
        <table class="detail-table">
          <thead>
            <tr><th>Day</th><th>Rank</th><th>Stars</th><th>Files</th><th>Lines</th><th>Clones</th><th>Duplication</th><th>Commit</th></tr>
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
              <td><a :href="`${repo.url}/tree/${a.headSha}`" target="_blank" rel="noopener"><code>{{ a.headSha.slice(0, 7) }}</code></a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="repo-cta">
      Want this for your own project?
      <NuxtLink to="/getting-started/installation">Install jscpd</NuxtLink> and run <code>jscpd .</code>
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
