/**
 * A daily snapshot of the page views of the blog posts and the docs pages
 * from Cloudflare Web Analytics.
 *
 * The beacon Cloudflare injects into every page reports page loads to Web
 * Analytics; this script reads them back through the GraphQL API and keeps
 * the ones of the posts in content/blog and of the docs pages (the rest of
 * content/) in data/analytics/months/<YYYY-MM>.json: each day's page views
 * and visits per path, the posts under `posts` and the docs pages under
 * `docs`. The 404 page reports too, under whatever address was asked for, so
 * any other address stays out.
 *
 * A run rewrites the last REFRESH_DAYS stored days (the last one was cut off
 * at the time of its run) and adds the days after them. Older days stay as
 * stored: Cloudflare answers about days older than about six days with a
 * sample, the counts rounded to tens, and such an answer never replaces a
 * stored day. The site keeps its own history whatever the API's retention is
 * (26 weeks).
 *
 * The docs pages were added to the snapshot in October 2026, after the posts,
 * and their counts come from exact answers only (EXACT_ONLY). The first run
 * that counts them reaches BACKFILL_DAYS back and keeps the days Cloudflare
 * answered in full, the last six or so.
 *
 * Every request covers one day. Cloudflare samples an answer that covers
 * many page loads: a 30-day request came back sampled one in ten, with the
 * small groups rounded away, and on 2026-10-19 a week of recent days came
 * back sampled one in ten to twenty, while the daily runs' two or three days
 * came back in full.
 *
 * composables/usePageViews.ts adds the days up for the blog list, the post
 * page and the docs pages. .github/workflows/analytics.yml runs this every morning before
 * the site rebuild.
 *
 * Needs CLOUDFLARE_ANALYTICS_TOKEN (an API token with Account Analytics:
 * Read on the account) and CLOUDFLARE_ACCOUNT_ID. The site tag is found from
 * the traffic of the production host, or given as CLOUDFLARE_SITE_TAG.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://api.cloudflare.com/client/v4/graphql'
const MONTHS_DIR = new URL('../data/analytics/months/', import.meta.url)
const CONTENT_DIR = new URL('../content/', import.meta.url)
const POSTS_DIR = new URL('../content/blog/', import.meta.url)
// What a day record counts, each a map of path to [views, visits].
const KINDS = ['posts', 'docs']
// A docs page sees a few views a day, and a sampled answer puts its sample
// interval (10 to 200 on 2026-10-19) on a page for each view in the sample.
// One view in the sample gave /project/v4 200 views on 2026-10-12, while the
// six days after brought it 26. A sampled or empty answer leaves these kinds
// out of a new day and never replaces them on a stored one.
const EXACT_ONLY = new Set(['docs'])
// content/trending.md only puts Trending into the header, pages/trending.vue
// renders that page.
const NOT_DOCS = new Set(['/trending'])

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
const CHUNK_DAYS = 1
const GROUP_LIMIT = 5000
// The API now and then answers the site lookup with no page loads for a
// while. On 2026-10-19 it came back empty at 08:01 UTC and with 3980 page
// loads of the last 7 days at 08:33. The lookup asks again before the run
// fails. A run that fails anyway leaves no hole, because the next one starts
// from the last stored day.
const LOOKUP_ATTEMPTS = 5
const LOOKUP_WAIT_MS = 3 * 60_000

const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID

const day = (date) => date.toISOString().slice(0, 10)
const addDays = (date, n) => new Date(date.getTime() + n * 86_400_000)
const utcMidnight = (date) => new Date(`${day(date)}T00:00:00Z`)
const lit = (value) => JSON.stringify(value)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
 * The paths of the docs pages, every content/**.md but the landing, the posts
 * and NOT_DOCS. Nuxt Content drops the numeric prefix of every part and names
 * an index.md after its folder.
 */
export async function docsPaths(dir = CONTENT_DIR) {
  const out = new Set()
  for (const entry of await readdir(dir, { recursive: true })) {
    const file = entry.split(sep).join('/')
    if (!file.endsWith('.md') || file === 'index.md' || file.startsWith('blog/')) continue
    const parts = file.slice(0, -3).split('/').map((part) => part.replace(/^\d+\./, '').toLowerCase())
    if (parts[parts.length - 1] === 'index') parts.pop()
    const path = `/${parts.join('/')}`
    if (!NOT_DOCS.has(path)) out.add(path)
  }
  return out
}

/**
 * The per-day records for every day of [since, until) from the day/path
 * groups: the views and visits of the paths in `pages.posts` and
 * `pages.docs`, plus how many groups the day had and the largest sample
 * interval among them.
 */
export function daysFrom(since, until, byDayPath, pages) {
  const out = {}
  for (let d = utcMidnight(new Date(since)); d < new Date(until); d = addDays(d, 1)) {
    out[day(d)] = { posts: {}, docs: {}, groups: 0, sample: 1 }
  }
  for (const g of byDayPath) {
    const record = out[g.dimensions.date]
    if (!record) continue
    // Every group of the day counts here: the group of a small post is the
    // one a sample drops.
    record.groups += 1
    record.sample = Math.max(record.sample, g.avg?.sampleInterval ?? 1)
    const path = normalizePath(g.dimensions.requestPath)
    const kind = KINDS.find((k) => pages[k].has(path))
    if (!kind) continue
    const prev = record[kind][path] ?? [0, 0]
    record[kind][path] = [prev[0] + (g.count ?? 0), prev[1] + (g.sum?.visits ?? 0)]
  }
  for (const record of Object.values(out)) {
    for (const kind of KINDS) {
      record[kind] = Object.fromEntries(Object.entries(record[kind]).sort(([a], [b]) => a.localeCompare(b)))
    }
  }
  return out
}

const views = (counts = {}) => Object.values(counts).reduce((sum, [v]) => sum + v, 0)
const sortedDays = (days) => Object.fromEntries(Object.entries(days).sort(([a], [b]) => a.localeCompare(b)))

/** A sampled or empty answer about a day: a sample rounds small counts to tens or away. */
const doubtful = (record) => record.sample >= SAMPLED_FROM || record.groups === 0

/**
 * The stored days of a month with the fresh ones put in, and for each date
 * the kinds kept as stored. A stored day keeps its posts or docs when the
 * fresh answer about it is doubtful. A new day takes the posts of any answer
 * and the EXACT_ONLY kinds of an exact one; a day without docs had no exact
 * answer for them.
 */
export function mergeDays(stored, fresh) {
  const days = { ...stored }
  const kept = {}
  for (const [date, record] of Object.entries(fresh)) {
    const old = days[date]
    const next = {}
    for (const kind of KINDS) {
      if (old?.[kind] && doubtful(record)) {
        next[kind] = old[kind]
        ;(kept[date] ??= []).push(kind)
      }
      else if (!(doubtful(record) && EXACT_ONLY.has(kind))) {
        next[kind] = record[kind]
      }
    }
    days[date] = next
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

/** Every stored day as [date, record], oldest first. */
async function storedDays() {
  let files
  try {
    files = (await readdir(MONTHS_DIR)).filter((f) => /^\d{4}-\d{2}\.json$/.test(f)).sort()
  }
  catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  const out = []
  for (const file of files) {
    out.push(...Object.entries((await readMonth(file.slice(0, -5))).days).sort(([a], [b]) => a.localeCompare(b)))
  }
  return out
}

/** The site tag whose page loads come from the production host, from the last week of traffic. */
async function discoverSiteTag(now) {
  const since = addDays(now, -7).toISOString()
  for (let attempt = 1; ; attempt++) {
    const data = await query(`sites: rumPageloadEventsAdaptiveGroups(limit: 100, filter: { datetime_geq: ${lit(since)}, datetime_lt: ${lit(now.toISOString())}, requestHost_in: ${lit(HOSTS)} }, orderBy: [count_DESC]) { count dimensions { siteTag requestHost } }`)
    const hit = data.sites.find((g) => g.count > 0)
    if (hit) {
      console.log(`site tag ${hit.dimensions.siteTag} (${hit.dimensions.requestHost}, ${hit.count} page loads in the last 7 days)`)
      return hit.dimensions.siteTag
    }
    if (attempt === LOOKUP_ATTEMPTS) {
      throw new Error(`no Web Analytics site reports ${HOSTS.join(', ')} in the last 7 days, asked ${LOOKUP_ATTEMPTS} times; set CLOUDFLARE_SITE_TAG`)
    }
    console.log(`no page loads of ${HOSTS.join(', ')} in the last 7 days, asking again in ${LOOKUP_WAIT_MS / 60_000} minutes (${attempt}/${LOOKUP_ATTEMPTS})`)
    await sleep(LOOKUP_WAIT_MS)
  }
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
  const pages = { posts: await postPaths(), docs: await docsPaths() }
  console.log(`${pages.posts.size} posts in content/blog, ${pages.docs.size} docs pages`)
  if (!siteTag) siteTag = await discoverSiteTag(now)
  const today = utcMidnight(now)
  const stored = await storedDays()
  const last = stored.length ? stored[stored.length - 1][0] : null
  // Start REFRESH_DAYS days before the end of the stored ones, or at the
  // beginning. The days after the last stored one are never skipped, so a
  // missed run leaves no hole.
  const firstDay = addDays(today, -BACKFILL_DAYS)
  let start = last ? addDays(utcMidnight(new Date(last)), 1 - REFRESH_DAYS) : firstDay
  // The first run that counts the docs pages reaches back to the beginning.
  if (stored.length && stored.every(([, record]) => !record.docs)) start = firstDay
  const since = start < firstDay ? firstDay : start

  let fresh = {}
  for (const [from, until] of chunks(since, addDays(today, 1), now)) {
    const data = await query(`byDayPath: rumPageloadEventsAdaptiveGroups(limit: ${GROUP_LIMIT}, filter: { siteTag: ${lit(siteTag)}, datetime_geq: ${lit(from.toISOString())}, datetime_lt: ${lit(until.toISOString())}, requestHost_in: ${lit(HOSTS)} }, orderBy: [count_DESC]) {
      count
      sum { visits }
      avg { sampleInterval }
      dimensions { date requestPath }
    }`)
    if (data.byDayPath.length >= GROUP_LIMIT) throw new Error(`more than ${GROUP_LIMIT} day/path groups between ${day(from)} and ${day(until)}; raise GROUP_LIMIT`)
    // A chunk ending mid-day (today) still covers that whole day.
    const end = until > utcMidnight(until) ? addDays(utcMidnight(until), 1) : until
    Object.assign(fresh, daysFrom(from.toISOString(), end.toISOString(), data.byDayPath, pages))
  }
  // The history starts on the first day with a view that is kept, or on the
  // first stored day: a backfill keeps no empty days before both.
  const firstStored = stored.length ? stored[0][0] : null
  const dates = Object.keys(fresh).sort()
  const keptViews = (record) => KINDS.reduce((sum, kind) => sum + (doubtful(record) && EXACT_ONLY.has(kind) ? 0 : views(record[kind])), 0)
  const firstView = dates.find((d) => keptViews(fresh[d]) > 0)
  fresh = Object.fromEntries(dates.filter((d) => (firstStored && d >= firstStored) || (firstView && d >= firstView)).map((d) => [d, fresh[d]]))

  await mkdir(MONTHS_DIR, { recursive: true })
  const result = {}
  const kept = {}
  for (const month of new Set(Object.keys(fresh).map((d) => d.slice(0, 7)))) {
    const file = await readMonth(month)
    const merged = mergeDays(file.days, Object.fromEntries(Object.entries(fresh).filter(([d]) => d.startsWith(month))))
    Object.assign(kept, merged.kept)
    Object.assign(result, merged.days)
    file.days = merged.days
    await writeFile(new URL(`${month}.json`, MONTHS_DIR), `${JSON.stringify(file, null, 2)}\n`)
  }
  for (const [date, record] of Object.entries(fresh)) {
    const counts = KINDS.map((kind) => {
      const name = kind === 'posts' ? 'post' : 'docs'
      if (!result[date][kind]) return `${name} left out`
      return `${views(result[date][kind])} ${name} views${kept[date]?.includes(kind) ? ' kept as stored' : ''}`
    })
    const answer = record.groups === 0 ? ', the answer was empty' : record.sample >= SAMPLED_FROM ? `, sampled 1:${Math.round(record.sample)}` : ''
    console.log(`${date}: ${counts.join(', ')}${answer}`)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
