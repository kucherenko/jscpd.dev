/**
 * A daily snapshot of Cloudflare Web Analytics for jscpd.dev.
 *
 * The beacon Cloudflare injects into every page reports page loads to Web
 * Analytics; this script reads them back through the GraphQL API and keeps
 * them in data/analytics:
 *
 * - months/<YYYY-MM>.json: each day's page views and visits, and the same
 *   per path. A run rewrites the last REFRESH_DAYS days (the API keeps
 *   counting a day for a while) and leaves older days as they are, so the
 *   site keeps its own history whatever the API's retention is.
 * - window.json: the last WINDOW_DAYS days by page, referrer, country,
 *   device, browser and OS. Replaced on every run.
 *
 * Every request covers at most CHUNK_DAYS days: a 30-day request came back
 * sampled one in ten, with the small groups rounded away, while a week is
 * counted in full. The sample interval of each answer is checked.
 *
 * composables/useSiteStats.ts reads the files for the views under the blog
 * posts and for the /stats page. .github/workflows/analytics.yml runs this
 * every morning before the site rebuild.
 *
 * Needs CLOUDFLARE_ANALYTICS_TOKEN (an API token with Account Analytics:
 * Read on the account) and CLOUDFLARE_ACCOUNT_ID. The site tag is found from
 * the traffic of the production host, or given as CLOUDFLARE_SITE_TAG.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const API = 'https://api.cloudflare.com/client/v4/graphql'
const DIR = new URL('../data/analytics/', import.meta.url)
const MONTHS_DIR = new URL('months/', DIR)
const WINDOW_FILE = new URL('window.json', DIR)

// The Web Analytics site, found from the traffic of HOSTS unless given. (The
// `token` in the data-cf-beacon attribute of the pages is the site token, a
// different value that matches nothing here.)
let siteTag = process.env.CLOUDFLARE_SITE_TAG || ''
// Preview deploys report under the same site tag with their own host names;
// only the production host counts.
const HOSTS = ['jscpd.dev', 'www.jscpd.dev']
// Where the first backfill starts; the API keeps six months, and the days
// before the first one with a page view are dropped.
const FIRST_DAY = '2026-03-01'
// Days rewritten on every run: the API still adds to a recent day.
const REFRESH_DAYS = 7
const CHUNK_DAYS = 7
const GROUP_LIMIT = 5000
const WINDOW_DAYS = 30
const TOP = 50

const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID

const day = (date) => date.toISOString().slice(0, 10)
const addDays = (date, n) => new Date(date.getTime() + n * 86_400_000)
const utcMidnight = (date) => new Date(`${day(date)}T00:00:00Z`)
const lit = (value) => JSON.stringify(value)

const filter = (since, until, withHosts = true) =>
  `{ siteTag: ${lit(siteTag)}, datetime_geq: ${lit(since)}, datetime_lt: ${lit(until)}${withHosts ? `, requestHost_in: ${lit(HOSTS)}` : ''} }`

const groups = (alias, dims, since, until, { limit = TOP, withHosts = true } = {}) =>
  `${alias}: rumPageloadEventsAdaptiveGroups(limit: ${limit}, filter: ${filter(since, until, withHosts)}, orderBy: [count_DESC]) {
    count
    sum { visits }
    avg { sampleInterval }
    ${dims.length ? `dimensions { ${dims.join(' ')} }` : ''}
  }`

let sampled = 1

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
  const data = json.data.viewer.accounts[0]
  for (const list of Object.values(data)) {
    for (const g of list) sampled = Math.max(sampled, g.avg?.sampleInterval ?? 1)
  }
  return data
}

// "/blog/post/" and "/blog/post/index.html" are the same page as "/blog/post".
export function normalizePath(path) {
  let out = String(path || '/').split(/[?#]/)[0]
  if (out.endsWith('/index.html')) out = out.slice(0, -'index.html'.length)
  if (out.length > 1) out = out.replace(/\/+$/, '')
  return out || '/'
}

const row = (g) => ({ views: g.count ?? 0, visits: g.sum?.visits ?? 0 })

/** The per-day records for every day of [since, until), from the two groupings. */
export function daysFrom(since, until, byDay, byDayPath) {
  const out = {}
  for (let d = utcMidnight(new Date(since)); d < new Date(until); d = addDays(d, 1)) {
    out[day(d)] = { views: 0, visits: 0, paths: {} }
  }
  for (const g of byDay) {
    const date = g.dimensions.date
    if (out[date]) Object.assign(out[date], row(g))
  }
  for (const g of byDayPath) {
    const date = g.dimensions.date
    if (!out[date]) continue
    const path = normalizePath(g.dimensions.requestPath)
    const prev = out[date].paths[path] ?? [0, 0]
    const r = row(g)
    out[date].paths[path] = [prev[0] + r.views, prev[1] + r.visits]
  }
  for (const d of Object.values(out)) d.paths = Object.fromEntries(Object.entries(d.paths).sort(([a], [b]) => a.localeCompare(b)))
  return out
}

/** Sums rows of several requests by their dimension value; `key` reads the value. */
export function sumBy(lists, key) {
  const out = new Map()
  for (const list of lists) {
    for (const g of list) {
      const k = key(g)
      const prev = out.get(k) ?? { views: 0, visits: 0 }
      const r = row(g)
      out.set(k, { views: prev.views + r.views, visits: prev.visits + r.visits })
    }
  }
  return [...out.entries()].sort(([ka, a], [kb, b]) => b.views - a.views || String(ka).localeCompare(String(kb)))
}

const sortedDays = (days) => Object.fromEntries(Object.entries(days).sort(([a], [b]) => a.localeCompare(b)))

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
  if (!siteTag) siteTag = await discoverSiteTag(now)
  const today = utcMidnight(now)
  const tomorrow = addDays(today, 1)
  const last = await lastStoredDay()
  // Start a week before the last stored day, or at the beginning. Days
  // between the two are never skipped, so a missed run leaves no hole.
  const firstDay = utcMidnight(new Date(FIRST_DAY))
  const start = last ? addDays(utcMidnight(new Date(last)), 1 - REFRESH_DAYS) : firstDay
  const since = start < firstDay ? firstDay : start

  let fresh = {}
  for (const [from, until] of chunks(since, tomorrow, now)) {
    const data = await query([
      groups('byDay', ['date'], from.toISOString(), until.toISOString(), { limit: CHUNK_DAYS + 1 }),
      groups('byDayPath', ['date', 'requestPath'], from.toISOString(), until.toISOString(), { limit: GROUP_LIMIT }),
    ].join('\n'))
    if (data.byDayPath.length >= GROUP_LIMIT) throw new Error(`more than ${GROUP_LIMIT} day/path groups between ${day(from)} and ${day(until)}; lower CHUNK_DAYS`)
    Object.assign(fresh, daysFrom(from.toISOString(), addDays(utcMidnight(until), until > utcMidnight(until) ? 1 : 0).toISOString(), data.byDay, data.byDayPath))
  }
  if (!last) {
    // The first backfill: the history starts on the first day with a page view.
    const dates = Object.keys(fresh).sort()
    const first = dates.find((d) => fresh[d].views > 0)
    fresh = Object.fromEntries(dates.filter((d) => first && d >= first).map((d) => [d, fresh[d]]))
  }

  await mkdir(MONTHS_DIR, { recursive: true })
  const months = new Set(Object.keys(fresh).map((d) => d.slice(0, 7)))
  for (const month of months) {
    const file = await readMonth(month)
    for (const [date, record] of Object.entries(fresh)) {
      if (date.startsWith(month)) file.days[date] = record
    }
    file.days = sortedDays(file.days)
    await writeFile(new URL(`${month}.json`, MONTHS_DIR), `${JSON.stringify(file, null, 2)}\n`)
  }
  for (const [date, d] of Object.entries(fresh)) console.log(`${date}: ${d.views} views, ${d.visits} visits, ${Object.keys(d.paths).length} pages`)

  // The breakdowns of the last WINDOW_DAYS days, up to now, a week per request.
  const windowSince = addDays(today, 1 - WINDOW_DAYS)
  const answers = []
  for (const [from, until] of chunks(windowSince, tomorrow, now)) {
    const s = from.toISOString()
    const u = until.toISOString()
    answers.push(await query([
      groups('total', [], s, u, { limit: 1 }),
      groups('hosts', ['requestHost'], s, u, { withHosts: false }),
      groups('pages', ['requestPath'], s, u, { limit: GROUP_LIMIT }),
      groups('referrers', ['refererHost'], s, u, { limit: 200 }),
      groups('countries', ['countryName'], s, u, { limit: 300 }),
      groups('devices', ['deviceType'], s, u),
      groups('browsers', ['userAgentBrowser'], s, u, { limit: 100 }),
      groups('os', ['userAgentOS'], s, u, { limit: 100 }),
    ].join('\n')))
  }
  const of = (alias) => answers.map((a) => a[alias])
  const named = (alias, dim, name) => sumBy(of(alias), (g) => g.dimensions[dim] ?? '').slice(0, TOP).map(([value, r]) => ({ [name]: value, ...r }))
  const [, total] = sumBy(of('total'), () => 'all')[0] ?? ['all', { views: 0, visits: 0 }]
  const window = {
    updatedAt: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    since: day(windowSince),
    until: day(today),
    ...total,
    hosts: named('hosts', 'requestHost', 'host'),
    pages: sumBy(of('pages'), (g) => normalizePath(g.dimensions.requestPath)).slice(0, TOP).map(([path, r]) => ({ path, ...r })),
    // A referrer on the site itself is a click within it, not a source.
    referrers: named('referrers', 'refererHost', 'host').filter((r) => !HOSTS.includes(r.host)),
    countries: named('countries', 'countryName', 'name'),
    devices: named('devices', 'deviceType', 'name'),
    browsers: named('browsers', 'userAgentBrowser', 'name'),
    os: named('os', 'userAgentOS', 'name'),
  }
  await writeFile(WINDOW_FILE, `${JSON.stringify(window, null, 2)}\n`)

  console.log(`\nLast ${WINDOW_DAYS} days (${window.since} to ${window.until}): ${window.views} views, ${window.visits} visits`)
  console.log(`hosts: ${window.hosts.map((h) => `${h.host || '?'} ${h.views}`).join(', ')}`)
  for (const p of window.pages.slice(0, 10)) console.log(`  ${p.views}\t${p.visits}\t${p.path}`)
  if (sampled > 1) console.log(`\nWARNING: some answers were sampled (interval ${sampled}); the numbers of those are estimates`)
  else console.log('\nno sampling in any answer')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
