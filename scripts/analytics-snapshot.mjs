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
// The CSP let the beacon through on this day (PR #71); nothing was counted before.
const FIRST_DAY = '2026-10-10'
// Days rewritten on every run: the API still adds to a recent day.
const REFRESH_DAYS = 7
// One request may cover 30 days and at most `limit` groups; a week of days
// times the paths visited stays well under that.
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
    ${dims.length ? `dimensions { ${dims.join(' ')} }` : ''}
  }`

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

async function main() {
  if (!token || !account) throw new Error('CLOUDFLARE_ANALYTICS_TOKEN and CLOUDFLARE_ACCOUNT_ID are required')
  const now = new Date()
  if (!siteTag) siteTag = await discoverSiteTag(now)
  const today = utcMidnight(now)
  const last = await lastStoredDay()
  // Start a week before the last stored day, or at the beginning. Days
  // between the two are never skipped, so a missed run leaves no hole.
  const start = last ? addDays(utcMidnight(new Date(last)), 1 - REFRESH_DAYS) : utcMidnight(new Date(FIRST_DAY))
  const since = start < utcMidnight(new Date(FIRST_DAY)) ? utcMidnight(new Date(FIRST_DAY)) : start

  const fresh = {}
  for (let from = since; from <= today; from = addDays(from, CHUNK_DAYS)) {
    const to = addDays(from, CHUNK_DAYS) <= today ? addDays(from, CHUNK_DAYS) : addDays(today, 1)
    const until = to > now ? now : to
    const data = await query([
      groups('byDay', ['date'], from.toISOString(), until.toISOString(), { limit: CHUNK_DAYS + 1 }),
      groups('byDayPath', ['date', 'requestPath'], from.toISOString(), until.toISOString(), { limit: GROUP_LIMIT }),
    ].join('\n'))
    if (data.byDayPath.length >= GROUP_LIMIT) throw new Error(`more than ${GROUP_LIMIT} day/path groups between ${day(from)} and ${day(to)}; lower CHUNK_DAYS`)
    Object.assign(fresh, daysFrom(from.toISOString(), to.toISOString(), data.byDay, data.byDayPath))
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

  // The breakdowns of the last WINDOW_DAYS days, up to now.
  const windowSince = addDays(today, 1 - WINDOW_DAYS)
  const s = windowSince.toISOString()
  const u = now.toISOString()
  const w = await query([
    groups('total', [], s, u, { limit: 1 }),
    groups('hosts', ['requestHost'], s, u, { withHosts: false }),
    groups('pages', ['requestPath'], s, u, { limit: GROUP_LIMIT }),
    groups('referrers', ['refererHost'], s, u),
    groups('countries', ['countryName'], s, u),
    groups('devices', ['deviceType'], s, u),
    groups('browsers', ['userAgentBrowser'], s, u),
    groups('os', ['userAgentOS'], s, u),
  ].join('\n'))

  // Paths merge after normalisation, so they are summed again and cut to TOP here.
  const pages = {}
  for (const g of w.pages) {
    const path = normalizePath(g.dimensions.requestPath)
    const prev = pages[path] ?? { path, views: 0, visits: 0 }
    const r = row(g)
    pages[path] = { path, views: prev.views + r.views, visits: prev.visits + r.visits }
  }
  const named = (list, key, name) => list.map((g) => ({ [name]: g.dimensions[key] ?? '', ...row(g) }))
  const window = {
    updatedAt: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    since: day(windowSince),
    until: day(today),
    ...row(w.total[0] ?? {}),
    hosts: named(w.hosts, 'requestHost', 'host'),
    pages: Object.values(pages).sort((a, b) => b.views - a.views || a.path.localeCompare(b.path)).slice(0, TOP),
    referrers: named(w.referrers, 'refererHost', 'host'),
    countries: named(w.countries, 'countryName', 'name'),
    devices: named(w.devices, 'deviceType', 'name'),
    browsers: named(w.browsers, 'userAgentBrowser', 'name'),
    os: named(w.os, 'userAgentOS', 'name'),
  }
  await writeFile(WINDOW_FILE, `${JSON.stringify(window, null, 2)}\n`)

  console.log(`\nLast ${WINDOW_DAYS} days (${window.since} to ${window.until}): ${window.views} views, ${window.visits} visits`)
  console.log(`hosts: ${window.hosts.map((h) => `${h.host || '?'} ${h.views}`).join(', ')}`)
  for (const p of window.pages.slice(0, 10)) console.log(`  ${p.views}\t${p.visits}\t${p.path}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
