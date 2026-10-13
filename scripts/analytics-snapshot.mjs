/**
 * A daily snapshot of the blog posts' page views from Cloudflare Web
 * Analytics.
 *
 * The beacon Cloudflare injects into every page reports page loads to Web
 * Analytics; this script reads them back through the GraphQL API and keeps
 * the ones of the posts in content/blog in
 * data/analytics/months/<YYYY-MM>.json: each day's page views and visits per
 * post. The 404 page reports too, under whatever address was asked for, so
 * any other /blog/ address stays out.
 *
 * A run rewrites the last REFRESH_DAYS stored days (the last one was cut off
 * at the time of its run) and adds the days after them. Older days stay as
 * stored: Cloudflare answers about days older than about six days with a
 * sample, the counts rounded to tens, and such an answer never replaces a
 * stored day. The site keeps its own history whatever the API's retention is
 * (26 weeks).
 *
 * Every request covers at most CHUNK_DAYS days: a 30-day request came back
 * sampled one in ten, with the small groups rounded away, while a week of
 * recent days is counted in full.
 *
 * composables/usePostViews.ts adds the days up for the blog list and the
 * post page. .github/workflows/analytics.yml runs this every morning before
 * the site rebuild.
 *
 * Needs CLOUDFLARE_ANALYTICS_TOKEN (an API token with Account Analytics:
 * Read on the account) and CLOUDFLARE_ACCOUNT_ID. The site tag is found from
 * the traffic of the production host, or given as CLOUDFLARE_SITE_TAG.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const API = 'https://api.cloudflare.com/client/v4/graphql'
const MONTHS_DIR = new URL('../data/analytics/months/', import.meta.url)
const POSTS_DIR = new URL('../content/blog/', import.meta.url)

// The Web Analytics site, found from the traffic of HOSTS unless given. (The
// `token` in the data-cf-beacon attribute of the pages is the site token, a
// different value that matches nothing here.)
let siteTag = process.env.CLOUDFLARE_SITE_TAG || ''
// Preview deploys report under the same site tag with their own host names;
// only the production host counts.
const HOSTS = ['jscpd.dev', 'www.jscpd.dev']
// How far the first backfill reaches: the API refuses anything older than 26
// weeks, and the days before the first one with a post view are dropped.
const BACKFILL_DAYS = 180
// Stored days a run rewrites: the last one, cut off at the time of its run,
// and the day before it, for a late report.
const REFRESH_DAYS = 2
// The sample interval from which an answer about a day counts as sampled.
// Recent days come back with 1 to 2 on a group here and there; days older
// than about six days came back at 10 to 40.
const SAMPLED_FROM = 5
const CHUNK_DAYS = 7
const GROUP_LIMIT = 5000

const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID

const day = (date) => date.toISOString().slice(0, 10)
const addDays = (date, n) => new Date(date.getTime() + n * 86_400_000)
const utcMidnight = (date) => new Date(`${day(date)}T00:00:00Z`)
const lit = (value) => JSON.stringify(value)

async function query(body) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: `{ viewer { accounts(filter: { accountTag: ${lit(account)} }) { ${body} } } }` }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json || json.errors?.length || !json.data?.viewer?.accounts?.length) {
    throw new Error(`GraphQL ${res.status}: ${JSON.stringify(json?.errors ?? json)}`)
  }
  return json.data.viewer.accounts[0]
}

/** "/blog/post/" and "/blog/post/index.html" are the same page as "/blog/post". */
export function normalizePath(path) {
  let out = String(path || '/').split(/[?#]/)[0]
  if (out.endsWith('/index.html')) out = out.slice(0, -'index.html'.length)
  if (out.length > 1) out = out.replace(/\/+$/, '')
  return out || '/'
}

/** The paths of the posts, named the way Nuxt Content names content/blog/<slug>.md. */
export async function postPaths(dir = POSTS_DIR) {
  const files = await readdir(dir)
  return new Set(files.filter((f) => f.endsWith('.md')).map((f) => `/blog/${f.slice(0, -3).replace(/^\d+\./, '').toLowerCase()}`))
}

/**
 * The per-day records for every day of [since, until) from the day/path
 * groups: the views and visits of the given post paths, plus how many groups
 * the day had and the largest sample interval among them.
 */
export function daysFrom(since, until, byDayPath, posts) {
  const out = {}
  for (let d = utcMidnight(new Date(since)); d < new Date(until); d = addDays(d, 1)) {
    out[day(d)] = { posts: {}, groups: 0, sample: 1 }
  }
  for (const g of byDayPath) {
    const record = out[g.dimensions.date]
    if (!record) continue
    // Every group of the day counts here: the group of a small post is the
    // one a sample drops.
    record.groups += 1
    record.sample = Math.max(record.sample, g.avg?.sampleInterval ?? 1)
    const path = normalizePath(g.dimensions.requestPath)
    if (!posts.has(path)) continue
    const prev = record.posts[path] ?? [0, 0]
    record.posts[path] = [prev[0] + (g.count ?? 0), prev[1] + (g.sum?.visits ?? 0)]
  }
  for (const record of Object.values(out)) {
    record.posts = Object.fromEntries(Object.entries(record.posts).sort(([a], [b]) => a.localeCompare(b)))
  }
  return out
}

const views = (record) => Object.values(record.posts).reduce((sum, [v]) => sum + v, 0)
const sortedDays = (days) => Object.fromEntries(Object.entries(days).sort(([a], [b]) => a.localeCompare(b)))

/**
 * The stored days of a month with the fresh ones put in. A stored day keeps
 * its record when the fresh answer about it came back sampled or empty: a
 * sample rounds small counts to tens or away.
 */
export function mergeDays(stored, fresh) {
  const days = { ...stored }
  const kept = []
  for (const [date, record] of Object.entries(fresh)) {
    if (days[date] && (record.sample >= SAMPLED_FROM || record.groups === 0)) {
      kept.push(date)
      continue
    }
    days[date] = { posts: record.posts }
  }
  return { days: sortedDays(days), kept }
}

async function readMonth(month) {
  try {
    return JSON.parse(await readFile(new URL(`${month}.json`, MONTHS_DIR), 'utf8'))
  }
  catch (error) {
    if (error.code === 'ENOENT') return { days: {} }
    throw error
  }
}

async function lastStoredDay() {
  let files
  try {
    files = (await readdir(MONTHS_DIR)).filter((f) => /^\d{4}-\d{2}\.json$/.test(f)).sort()
  }
  catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
  for (const file of files.reverse()) {
    const dates = Object.keys((await readMonth(file.slice(0, -5))).days).sort()
    if (dates.length) return dates[dates.length - 1]
  }
  return null
}

/** The site tag whose page loads come from the production host, from the last week of traffic. */
async function discoverSiteTag(now) {
  const since = addDays(now, -7).toISOString()
  const data = await query(`sites: rumPageloadEventsAdaptiveGroups(limit: 100, filter: { datetime_geq: ${lit(since)}, datetime_lt: ${lit(now.toISOString())}, requestHost_in: ${lit(HOSTS)} }, orderBy: [count_DESC]) { count dimensions { siteTag requestHost } }`)
  const hit = data.sites.find((g) => g.count > 0)
  if (!hit) throw new Error(`no Web Analytics site reports ${HOSTS.join(', ')} in the last 7 days; set CLOUDFLARE_SITE_TAG`)
  console.log(`site tag ${hit.dimensions.siteTag} (${hit.dimensions.requestHost}, ${hit.count} page loads in the last 7 days)`)
  return hit.dimensions.siteTag
}

/** [from, to) in CHUNK_DAYS pieces, the last one ending at `now`. */
function chunks(from, to, now) {
  const out = []
  for (let a = from; a < to; a = addDays(a, CHUNK_DAYS)) {
    const b = addDays(a, CHUNK_DAYS) < to ? addDays(a, CHUNK_DAYS) : to
    out.push([a, b > now ? now : b])
  }
  return out
}

async function main() {
  if (!token || !account) throw new Error('CLOUDFLARE_ANALYTICS_TOKEN and CLOUDFLARE_ACCOUNT_ID are required')
  const now = new Date()
  const posts = await postPaths()
  console.log(`${posts.size} posts in content/blog`)
  if (!siteTag) siteTag = await discoverSiteTag(now)
  const today = utcMidnight(now)
  const last = await lastStoredDay()
  // Start REFRESH_DAYS days before the end of the stored ones, or at the
  // beginning. The days after the last stored one are never skipped, so a
  // missed run leaves no hole.
  const firstDay = addDays(today, -BACKFILL_DAYS)
  const start = last ? addDays(utcMidnight(new Date(last)), 1 - REFRESH_DAYS) : firstDay
  const since = start < firstDay ? firstDay : start

  let fresh = {}
  for (const [from, until] of chunks(since, addDays(today, 1), now)) {
    const data = await query(`byDayPath: rumPageloadEventsAdaptiveGroups(limit: ${GROUP_LIMIT}, filter: { siteTag: ${lit(siteTag)}, datetime_geq: ${lit(from.toISOString())}, datetime_lt: ${lit(until.toISOString())}, requestHost_in: ${lit(HOSTS)} }, orderBy: [count_DESC]) {
      count
      sum { visits }
      avg { sampleInterval }
      dimensions { date requestPath }
    }`)
    if (data.byDayPath.length >= GROUP_LIMIT) throw new Error(`more than ${GROUP_LIMIT} day/path groups between ${day(from)} and ${day(until)}; lower CHUNK_DAYS`)
    // A chunk ending mid-day (today) still covers that whole day.
    const end = until > utcMidnight(until) ? addDays(utcMidnight(until), 1) : until
    Object.assign(fresh, daysFrom(from.toISOString(), end.toISOString(), data.byDayPath, posts))
  }
  if (!last) {
    // The first backfill: the history starts on the first day with a post view.
    const dates = Object.keys(fresh).sort()
    const first = dates.find((d) => views(fresh[d]) > 0)
    fresh = Object.fromEntries(dates.filter((d) => first && d >= first).map((d) => [d, fresh[d]]))
  }

  await mkdir(MONTHS_DIR, { recursive: true })
  const kept = new Set()
  for (const month of new Set(Object.keys(fresh).map((d) => d.slice(0, 7)))) {
    const file = await readMonth(month)
    const merged = mergeDays(file.days, Object.fromEntries(Object.entries(fresh).filter(([d]) => d.startsWith(month))))
    for (const d of merged.kept) kept.add(d)
    file.days = merged.days
    await writeFile(new URL(`${month}.json`, MONTHS_DIR), `${JSON.stringify(file, null, 2)}\n`)
  }
  for (const [date, record] of Object.entries(fresh)) {
    const sample = `sampled 1:${Math.round(record.sample)}`
    if (kept.has(date)) console.log(`${date}: kept as stored, the answer ${record.groups ? `came back ${sample}` : 'was empty'}`)
    else console.log(`${date}: ${views(record)} views of ${Object.keys(record.posts).length} posts${record.sample >= SAMPLED_FROM ? `, an estimate (${sample})` : ''}`)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
