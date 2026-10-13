<script setup lang="ts">
// Cloudflare Web Analytics for the whole site, from the snapshot
// scripts/analytics-snapshot.mjs takes every morning (data/analytics).
import { loadSiteStats } from '~/composables/useSiteStats'

definePageMeta({ layout: 'default' })

const title = 'Site statistics'
const description = 'Visits and page views of jscpd.dev from Cloudflare Web Analytics, refreshed once a day.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
defineOgImage('Docs', { headline: 'jscpd.dev', title, description })

const { data } = await useAsyncData('site-stats', loadSiteStats)
const stats = computed(() => data.value!)
const window = computed(() => stats.value.window)
const first = computed(() => stats.value.days[0]?.date ?? null)
const updatedDay = computed(() => stats.value.updatedAt?.slice(0, 10) ?? null)
const updated = computed(() => stats.value.updatedAt
  ? `${new Date(stats.value.updatedAt).toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} UTC`
  : null)

const { data: posts } = await useAsyncData('stats-posts', () => queryCollection('blog').where('publishedAt', '<=', new Date().toISOString()).order('date', 'DESC').all())
const postRows = computed(() => {
  const byPath = new Map(stats.value.paths.map(p => [p.path, p]))
  return (posts.value ?? [])
    .map(p => ({ path: p.path, title: p.title, date: p.date, views: byPath.get(p.path)?.views ?? 0, visits: byPath.get(p.path)?.visits ?? 0 }))
    .sort((a, b) => b.views - a.views || b.date.localeCompare(a.date))
})

const TOP_PAGES = 20
const TOP_SMALL = 8
const referrer = (host: string) => host || 'Direct or unknown'
const share = (n: number, total: number) => total ? `${Math.round((100 * n) / total)}%` : ''
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="title" :description="description" headline="jscpd.dev" />
      <UPageBody>
        <p v-if="!stats.days.length" class="stats-note">
          No numbers yet: the first snapshot is taken at 07:45 UTC and the site rebuilds after it.
        </p>
        <template v-else>
          <div class="stats-tiles">
            <div class="stats-tile">
              <span class="stats-tile-value">{{ num(stats.totals.visits) }}</span>
              <span class="stats-tile-label">visits since {{ formatDay(first!, { month: 'short', day: 'numeric' }) }}</span>
            </div>
            <div class="stats-tile">
              <span class="stats-tile-value">{{ num(stats.totals.views) }}</span>
              <span class="stats-tile-label">page views since {{ formatDay(first!, { month: 'short', day: 'numeric' }) }}</span>
            </div>
            <div v-if="window" class="stats-tile">
              <span class="stats-tile-value">{{ num(window.visits) }}</span>
              <span class="stats-tile-label">visits, last 30 days</span>
            </div>
            <div v-if="window" class="stats-tile">
              <span class="stats-tile-value">{{ num(window.views) }}</span>
              <span class="stats-tile-label">page views, last 30 days</span>
            </div>
          </div>

          <StatsChart :days="stats.days" :partial="updatedDay" />

          <section v-if="window?.pages.length" class="stats-section">
            <h2>Pages, last 30 days</h2>
            <div class="table-scroll">
              <table class="stats-table">
                <thead>
                  <tr><th>Page</th><th class="num">Views</th><th class="num">Visits</th></tr>
                </thead>
                <tbody>
                  <tr v-for="p in window.pages.slice(0, TOP_PAGES)" :key="p.path">
                    <td class="stats-path"><NuxtLink :to="p.path">{{ p.path }}</NuxtLink></td>
                    <td class="num">{{ num(p.views) }}</td>
                    <td class="num">{{ num(p.visits) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-if="postRows.length" class="stats-section">
            <h2>Blog posts, all time</h2>
            <div class="table-scroll">
              <table class="stats-table">
                <thead>
                  <tr><th>Post</th><th class="stats-date">Published</th><th class="num">Views</th><th class="num">Visits</th></tr>
                </thead>
                <tbody>
                  <tr v-for="p in postRows" :key="p.path">
                    <td><NuxtLink :to="p.path">{{ p.title }}</NuxtLink></td>
                    <td class="stats-date">{{ formatPostDate(p.date) }}</td>
                    <td class="num">{{ num(p.views) }}</td>
                    <td class="num">{{ num(p.visits) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div v-if="window" class="stats-grid">
            <section class="stats-section">
              <h2>Referrers</h2>
              <ul class="stats-list">
                <li v-for="r in window.referrers.slice(0, TOP_SMALL)" :key="r.host">
                  <span class="stats-list-name">{{ referrer(r.host) }}</span>
                  <span class="stats-list-value">{{ num(r.visits) }} <small>{{ share(r.visits, window.visits) }}</small></span>
                </li>
              </ul>
            </section>
            <section class="stats-section">
              <h2>Countries</h2>
              <ul class="stats-list">
                <li v-for="c in window.countries.slice(0, TOP_SMALL)" :key="c.name">
                  <span class="stats-list-name">{{ c.name || 'Unknown' }}</span>
                  <span class="stats-list-value">{{ num(c.visits) }} <small>{{ share(c.visits, window.visits) }}</small></span>
                </li>
              </ul>
            </section>
            <section class="stats-section">
              <h2>Devices</h2>
              <ul class="stats-list">
                <li v-for="d in window.devices.slice(0, TOP_SMALL)" :key="d.name">
                  <span class="stats-list-name">{{ d.name || 'Unknown' }}</span>
                  <span class="stats-list-value">{{ num(d.visits) }} <small>{{ share(d.visits, window.visits) }}</small></span>
                </li>
              </ul>
            </section>
            <section class="stats-section">
              <h2>Browsers</h2>
              <ul class="stats-list">
                <li v-for="b in window.browsers.slice(0, TOP_SMALL)" :key="b.name">
                  <span class="stats-list-name">{{ b.name || 'Unknown' }}</span>
                  <span class="stats-list-value">{{ num(b.visits) }} <small>{{ share(b.visits, window.visits) }}</small></span>
                </li>
              </ul>
            </section>
            <section class="stats-section">
              <h2>Operating systems</h2>
              <ul class="stats-list">
                <li v-for="o in window.os.slice(0, TOP_SMALL)" :key="o.name">
                  <span class="stats-list-name">{{ o.name || 'Unknown' }}</span>
                  <span class="stats-list-value">{{ num(o.visits) }} <small>{{ share(o.visits, window.visits) }}</small></span>
                </li>
              </ul>
            </section>
          </div>

          <p class="stats-note">
            Counted by the Cloudflare Web Analytics beacon on every page, without cookies, so a visit is a
            page load with no referrer from the site itself. Crawlers and scripts never run the beacon and are
            not counted; browsers with an ad blocker mostly aren't either, so the real numbers are higher. The
            <a href="https://github.com/kucherenko/jscpd.dev/blob/master/scripts/analytics-snapshot.mjs" target="_blank" rel="noopener">snapshot script</a>
            reads the numbers through the GraphQL API once a day<template v-if="updated">, last at {{ updated }}</template>;
            the last 30 days come straight from the API, the all-time numbers add up the days the site has stored since
            {{ formatDay(first!) }}.
          </p>
        </template>
      </UPageBody>
    </UPage>
  </UContainer>
</template>

<style scoped>
.stats-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .stats-tiles {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.stats-tile {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
  min-width: 0;
}

.stats-tile-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-highlighted, inherit);
  letter-spacing: -0.01em;
}

.stats-tile-label {
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.stats-section {
  margin-top: 2rem;
  min-width: 0;
}

.stats-section h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 0 2rem;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.table-scroll {
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.stats-table th,
.stats-table td {
  text-align: left;
  padding: 0.4375rem 0.75rem;
  border-bottom: 1px solid var(--ui-border, rgba(100, 116, 139, 0.12));
  vertical-align: top;
}

.stats-table th {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
  white-space: nowrap;
}

.stats-table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.stats-table a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.stats-table a:hover {
  text-decoration: underline;
}

.stats-path {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
}

.stats-date {
  white-space: nowrap;
  color: var(--ui-text-muted, #64748b);
}

/* On a phone the date column would squeeze the titles into a word per line. */
@media (max-width: 640px) {
  .stats-date {
    display: none;
  }
}

.stats-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
}

.stats-list li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.375rem 0;
  border-bottom: 1px solid var(--ui-border, rgba(100, 116, 139, 0.12));
}

.stats-list-name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.stats-list-value {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.stats-list-value small {
  color: var(--ui-text-muted, #64748b);
  margin-left: 0.25rem;
}

.stats-note {
  margin-top: 2rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--ui-text-muted, #64748b);
}

.stats-note a {
  color: var(--jscpd-blue, #007bff);
}
</style>
