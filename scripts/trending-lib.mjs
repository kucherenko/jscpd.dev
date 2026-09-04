/**
 * Shared helpers for the trending pipeline.
 *
 * Daily snapshots in data/trending/YYYY-MM-DD.json are the source of truth.
 * Everything else (data/trending-history.json, data/trending/repos/**,
 * data/trending.json) is derived from them by build-trending-index.mjs.
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const DATA_DIR = join(ROOT, 'data')
export const DAYS_DIR = join(DATA_DIR, 'trending')
export const REPOS_DIR = join(DAYS_DIR, 'repos')
export const LATEST_FILE = join(DATA_DIR, 'trending.json')
export const HISTORY_FILE = join(DATA_DIR, 'trending-history.json')
export const REPO_INDEX_FILE = join(DATA_DIR, 'trending-repos.json')

export const round2 = (n) => typeof n === 'number' ? Math.round(n * 100) / 100 : n
const sum = (arr, pick) => arr.reduce((acc, x) => acc + (pick(x) || 0), 0)
const pct = (part, whole) => whole ? round2((part / whole) * 100) : 0

/** UTC calendar day of an ISO timestamp — the key every snapshot is filed under. */
export const dayOf = (iso) => iso.slice(0, 10)

/** Aggregate statistics for one day across all analyzed repos. */
export function summarize(repos) {
  const lines = sum(repos, r => r.total.lines)
  const tokens = sum(repos, r => r.total.tokens)
  const duplicatedLines = sum(repos, r => r.total.duplicatedLines)
  const duplicatedTokens = sum(repos, r => r.total.duplicatedTokens)
  const percentages = repos.map(r => r.total.percentage || 0).sort((a, b) => a - b)
  const mid = Math.floor(percentages.length / 2)
  const median = percentages.length === 0
    ? 0
    : percentages.length % 2 ? percentages[mid] : (percentages[mid - 1] + percentages[mid]) / 2

  const byPct = [...repos].sort((a, b) => (b.total.percentage || 0) - (a.total.percentage || 0))
  const byClones = [...repos].sort((a, b) => (b.total.clones || 0) - (a.total.clones || 0))
  const brief = (r) => r ? { name: r.name, clones: r.total.clones, percentage: r.total.percentage } : null

  const languages = new Map()
  for (const r of repos) {
    const key = r.language || 'Other'
    const cur = languages.get(key) || { language: key, repos: 0, clones: 0, lines: 0, duplicatedLines: 0 }
    cur.repos += 1
    cur.clones += r.total.clones || 0
    cur.lines += r.total.lines || 0
    cur.duplicatedLines += r.total.duplicatedLines || 0
    languages.set(key, cur)
  }

  return {
    repos: repos.length,
    sources: sum(repos, r => r.total.sources),
    lines,
    tokens,
    clones: sum(repos, r => r.total.clones),
    duplicatedLines,
    duplicatedTokens,
    // weighted: duplicated lines over all scanned lines
    percentage: pct(duplicatedLines, lines),
    percentageTokens: pct(duplicatedTokens, tokens),
    // unweighted: mean / median of per-repo duplication
    avgPercentage: repos.length ? round2(sum(repos, r => r.total.percentage) / repos.length) : 0,
    medianPercentage: round2(median),
    mostDuplicated: brief(byPct[0]),
    cleanest: brief(byPct[byPct.length - 1]),
    mostClones: brief(byClones[0]),
    languages: [...languages.values()]
      .map(l => ({ ...l, percentage: pct(l.duplicatedLines, l.lines) }))
      .sort((a, b) => b.repos - a.repos || b.clones - a.clones)
  }
}

/** Build a snapshot document from a run's repos. */
export function makeSnapshot({ generatedAt, repos, source = 'github-trending-daily' }) {
  return {
    date: dayOf(generatedAt),
    generatedAt,
    source,
    summary: summarize(repos),
    repos
  }
}

export async function readSnapshots() {
  const files = (await readdir(DAYS_DIR)).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
  const days = []
  for (const f of files) days.push(JSON.parse(await readFile(join(DAYS_DIR, f), 'utf8')))
  return days
}

export async function writeSnapshot(snapshot) {
  await mkdir(DAYS_DIR, { recursive: true })
  const file = join(DAYS_DIR, `${snapshot.date}.json`)
  await writeFile(file, JSON.stringify(snapshot, null, 1) + '\n')
  return file
}

/**
 * Derive the small cross-day index (per-day totals only — imported by every
 * trending page, so it must stay a few hundred bytes per day), one file per
 * repository with its full latest analysis plus every appearance, a flat
 * repo list (name → latest analysis day) for the route list and sitemap,
 * and the latest-day copy at data/trending.json.
 */
export async function buildIndex() {
  const days = await readSnapshots()
  if (days.length === 0) throw new Error(`no snapshots in ${DAYS_DIR}`)

  const history = {
    updatedAt: days[days.length - 1].generatedAt,
    days: days.map(d => ({ date: d.date, generatedAt: d.generatedAt, ...d.summary, languages: undefined }))
  }
  // drop the undefined placeholder so the JSON stays flat
  for (const d of history.days) delete d.languages
  await writeFile(HISTORY_FILE, JSON.stringify(history, null, 1) + '\n')

  const repos = new Map()
  for (const day of days) {
    day.repos.forEach((r, i) => {
      const entry = repos.get(r.name) || { name: r.name, url: r.url, appearances: [], latest: null }
      entry.appearances.push({
        date: day.date,
        rank: i + 1,
        stars: r.stars,
        starsToday: r.starsToday,
        headSha: r.headSha,
        sources: r.total.sources,
        lines: r.total.lines,
        clones: r.total.clones,
        duplicatedLines: r.total.duplicatedLines,
        percentage: r.total.percentage
      })
      entry.latest = { date: day.date, generatedAt: day.generatedAt, ...r }
      repos.set(r.name, entry)
    })
  }
  await rm(REPOS_DIR, { recursive: true, force: true })
  for (const entry of repos.values()) {
    const file = join(REPOS_DIR, `${entry.name}.json`)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(entry, null, 1) + '\n')
  }

  const repoIndex = [...repos.values()]
    .map(r => ({ name: r.name, date: r.latest.date }))
    .sort((a, b) => a.name.localeCompare(b.name))
  await writeFile(REPO_INDEX_FILE, JSON.stringify(repoIndex, null, 1) + '\n')

  await writeFile(LATEST_FILE, JSON.stringify(days[days.length - 1], null, 1) + '\n')
  return { days: days.length, repos: repos.size }
}
