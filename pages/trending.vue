<script setup lang="ts">
import data from '~/data/trending.json'

definePageMeta({ layout: 'default' })

const title = 'Trending Repos, Analyzed — jscpd'
const description = 'Daily jscpd analysis of GitHub trending repositories — how much copy/pasted code ships in today\'s hottest projects.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})

const repoCount = data.repos.length
const totalClones = data.repos.reduce((sum, r) => sum + (r.total.clones || 0), 0)
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
      <p class="trending-hero-stats">
        <span><strong>{{ repoCount }}</strong> repos analyzed today</span>
        <span class="hero-stats-sep">·</span>
        <span><strong>{{ totalClones.toLocaleString('en-US') }}</strong> clones found</span>
      </p>
    </section>

    <section class="trending-body">
      <TrendingRepos />
    </section>
  </div>
</template>

<style scoped>
.trending-page {
  max-width: 60rem;
  margin: 0 auto;
  padding: 0 1rem 4rem;
}

.trending-hero {
  text-align: center;
  padding: 4rem 0 2.5rem;
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

.trending-subtitle a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.trending-subtitle a:hover {
  text-decoration: underline;
}

.trending-hero-stats {
  margin: 1.25rem 0 0;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}

.trending-hero-stats strong {
  color: var(--ui-text-highlighted, inherit);
  font-variant-numeric: tabular-nums;
}

.hero-stats-sep {
  margin: 0 0.5rem;
}

@media (max-width: 640px) {
  .trending-hero {
    padding: 2.5rem 0 1.75rem;
  }
}
</style>
