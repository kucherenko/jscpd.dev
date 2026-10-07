/**
 * Shared helpers for the trending pipeline.
 *
 * Daily snapshots in data/trending/YYYY-MM-DD.json are the source of truth.
 * Everything else (data/trending-history.json, data/trending/repos/**,
 * data/trending/weeks/**, data/trending-baselines.json, data/trending.json
 * and data/health-corpus.json) is derived from them by
 * build-trending-index.mjs.
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  classifyPath, codeScanConfig, groupClones, hasCodeMetric, isoWeek, isoWeekRange, MIN_CODE_FILES, percentile, round2
} from './trending-rules.mjs'

export { round2 }

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const DATA_DIR = join(ROOT, 'data')
export const DAYS_DIR = join(DATA_DIR, 'trending')
export const REPOS_DIR = join(DAYS_DIR, 'repos')
export const WEEKS_DIR = join(DAYS_DIR, 'weeks')
export const LATEST_FILE = join(DATA_DIR, 'trending.json')
export const HISTORY_FILE = join(DATA_DIR, 'trending-history.json')
export const REPO_INDEX_FILE = join(DATA_DIR, 'trending-repos.json')
export const BASELINES_FILE = join(DATA_DIR, 'trending-baselines.json')
export const HEALTH_CORPUS_FILE = join(DATA_DIR, 'health-corpus.json')

// The calibration corpus the jscpd repo consumes (rust/scripts/
// calibrate-health.mjs). Raw measured shares only — never scores — so it
// stays valid across scoring-constant changes. 60 days of headroom over the
// 7-day window the consumer uses.
const HEALTH_CORPUS_RETENTION_DAYS = 60
// A language gets its own baseline row once this many repos were measured.
const MIN_BASELINE_REPOS = 5
// A day's code median needs this many code-measured repos; with fewer the
// day keeps to its all-files numbers (one repo is not a median).
const MIN_DAY_CODE_REPOS = 3

const sum = (arr, pick) => arr.reduce((acc, x) => acc + (pick(x) || 0), 0)
const pct = (part, whole) => whole ? round2((part / whole) * 100) : 0
const sortedValues = (arr, pick) => arr.map(pick).sort((a, b) => a - b)

/** UTC calendar day of an ISO timestamp — the key every snapshot is filed under. */
export const dayOf = (iso) => iso.slice(0, 10)

/** A UTC calendar day shifted by `days` (negative goes back). */
const offsetDay = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Aggregate statistics for one day across all analyzed repos. */
export function summarize(repos) {
  const lines = sum(repos, r => r.total.lines)
  const tokens = sum(repos, r => r.total.tokens)
  const duplicatedLines = sum(repos, r => r.total.duplicatedLines)
  const duplicatedTokens = sum(repos, r => r.total.duplicatedTokens)
  const percentages = sortedValues(repos, r => r.total.percentage || 0)

  const byPct = [...repos].sort((a, b) => (b.total.percentage || 0) - (a.total.percentage || 0))
  const byClones = [...repos].sort((a, b) => (b.total.clones || 0) - (a.total.clones || 0))
  const brief = (r) => r ? { name: r.name, clones: r.total.clones, percentage: r.total.percentage } : null

  // The code scan (trending-scan.mjs) is absent from days measured before it
  // existed and from repos whose scan failed, and too narrow to quote for
  // repos with a handful of code files: aggregate over the repos that have
  // one, and omit the fields on a day with too few of them.
  const coded = repos.filter(hasCodeMetric)
  const codeBrief = (r) => r ? { name: r.name, clones: r.code.clones, percentage: r.code.percentage } : null
  const byCodePct = [...coded].sort((a, b) => b.code.percentage - a.code.percentage)
  const codeLines = sum(coded, r => r.code.lines)
  const codeDuplicatedLines = sum(coded, r => r.code.duplicatedLines)
  const codeStats = coded.length >= MIN_DAY_CODE_REPOS ? {
    codeRepos: coded.length,
    codeSources: sum(coded, r => r.code.sources),
    codeLines,
    codeClones: sum(coded, r => r.code.clones),
    codeDuplicatedLines,
    codePercentage: pct(codeDuplicatedLines, codeLines),
    codeMedianPercentage: percentile(sortedValues(coded, r => r.code.percentage), 50),
    codeMostDuplicated: codeBrief(byCodePct[0]),
    codeCleanest: codeBrief(byCodePct[byCodePct.length - 1]),
    generatedFiles: sum(coded, r => r.code.generated?.files)
  } : {}

  // Health is optional per repo (null when its --dashboard run failed, or
  // in snapshots taken before health scoring shipped): aggregate only over
  // the repos that have a score, and omit these fields entirely on a day
  // where none do, rather than reporting a misleading average of zero.
  const scored = repos.filter(r => typeof r.health?.score === 'number')
  const healthBrief = (r) => r ? { name: r.name, score: r.health.score, grade: r.health.grade } : null
  const byHealth = [...scored].sort((a, b) => b.health.score - a.health.score)
  const healthStats = scored.length ? {
    avgHealth: round2(sum(scored, r => r.health.score) / scored.length),
    healthiest: healthBrief(byHealth[0]),
    leastHealthy: healthBrief(byHealth[byHealth.length - 1])
  } : {}

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
    medianPercentage: percentile(percentages, 50) ?? 0,
    mostDuplicated: brief(byPct[0]),
    cleanest: brief(byPct[byPct.length - 1]),
    mostClones: brief(byClones[0]),
    ...codeStats,
    ...healthStats,
    languages: [...languages.values()]
      .map(l => ({ ...l, percentage: pct(l.duplicatedLines, l.lines) }))
      .sort((a, b) => b.repos - a.repos || b.clones - a.clones)
  }
}

/** Build a snapshot document from a run's repos. */
export function makeSnapshot({ generatedAt, repos, jscpdVersion = null, source = 'github-trending-daily' }) {
  return {
    date: dayOf(generatedAt),
    generatedAt,
    source,
    // The jscpd that measured this day — its exclusion rules (markup, data,
    // text) are what the health shares mean. Read once per run in
    // analyze-trending.mjs so every jscpd invocation is covered.
    jscpdVersion,
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

const writeJson = (file, value) => writeFile(file, JSON.stringify(value, null, 1) + '\n')

/**
 * The clone lists as the pages read them: one entry per duplicated fragment
 * with a copy count and a file-kind label. Snapshots from before the
 * grouping stored one entry per pair; those are folded here, so the copy
 * counts of old days are lower bounds (only the ten largest pairs survived).
 */
function withFindings(repo) {
  const findings = (list) => groupClones(list ?? []).map(({ fragment, ...g }) => ({ ...g, kind: classifyPath(g.first.name) }))
  return {
    ...repo,
    topClones: findings(repo.topClones),
    code: repo.code ? { ...repo.code, topClones: findings(repo.code.topClones) } : null
  }
}

const totalBrief = (r) => ({
  sources: r.total.sources,
  lines: r.total.lines,
  clones: r.total.clones,
  duplicatedLines: r.total.duplicatedLines,
  percentage: r.total.percentage
})

// null unless the code scan ran and covers enough files to quote.
const codeBrief = (r) => hasCodeMetric(r) ? {
  sources: r.code.sources,
  lines: r.code.lines,
  clones: r.code.clones,
  duplicatedLines: r.code.duplicatedLines,
  percentage: r.code.percentage,
  generated: r.code.generated?.files ?? 0
} : null

const baselineRow = (language, repos) => {
  const values = sortedValues(repos, r => r.code.percentage)
  return { language, repos: values.length, p25: percentile(values, 25), median: percentile(values, 50), p75: percentile(values, 75), values }
}

/**
 * Derive everything the site reads from the snapshots: the small cross-day
 * index (per-day totals only — imported by every trending page, so it must
 * stay a few hundred bytes per day), one file per repository with its full
 * latest analysis plus every appearance, one file per ISO week, the flat
 * repo list (name → latest analysis day) for the route list and sitemap,
 * the per-language baselines, the health calibration corpus and the
 * latest-day copy at data/trending.json.
 */
export async function buildIndex() {
  const days = await readSnapshots()
  if (days.length === 0) throw new Error(`no snapshots in ${DAYS_DIR}`)
  const lastDay = days[days.length - 1]

  const repos = new Map()
  const weeks = new Map()
  for (const day of days) {
    const week = isoWeek(day.date)
    const wk = weeks.get(week) || { week, ...isoWeekRange(week), days: [], repos: new Map(), latest: new Map() }
    wk.days.push(day.date)
    weeks.set(week, wk)

    day.repos.forEach((r, i) => {
      const entry = repos.get(r.name) || { name: r.name, url: r.url, appearances: [], latest: null }
      entry.appearances.push({
        date: day.date,
        rank: i + 1,
        stars: r.stars,
        starsToday: r.starsToday,
        headSha: r.headSha,
        ...totalBrief(r),
        // null before the code scan existed, or when it covers too few files
        codePercentage: codeBrief(r)?.percentage ?? null,
        codeSources: r.code?.sources ?? null,
        // null on a day whose --dashboard run failed, or before health
        // scoring shipped (2026-09-18) — every consumer treats it as optional.
        healthScore: r.health?.score ?? null,
        healthGrade: r.health?.grade ?? null
      })
      entry.latest = { date: day.date, generatedAt: day.generatedAt, ...withFindings(r) }
      repos.set(r.name, entry)

      // A repo trending on several days of the week is listed once, with
      // the week's last measurement and its best rank.
      const seen = wk.repos.get(r.name)
      const finding = (hasCodeMetric(r) ? r.code.topClones : r.topClones)?.[0]
      const first = finding ? groupClones([finding])[0] : null
      wk.repos.set(r.name, {
        name: r.name,
        url: r.url,
        description: r.description,
        language: r.language,
        stars: r.stars,
        starsToday: Math.max(seen?.starsToday ?? 0, r.starsToday ?? 0) || null,
        days: (seen?.days ?? 0) + 1,
        rank: Math.min(seen?.rank ?? Infinity, i + 1),
        date: day.date,
        total: totalBrief(r),
        code: codeBrief(r),
        topFinding: first ? {
          format: first.format, lines: first.lines, copies: first.copies, kind: classifyPath(first.first.name),
          first: first.first, scope: hasCodeMetric(r) ? 'code' : 'all'
        } : null
      })
      wk.latest.set(r.name, r)
    })
  }

  await rm(REPOS_DIR, { recursive: true, force: true })
  for (const entry of repos.values()) {
    const file = join(REPOS_DIR, `${entry.name}.json`)
    await mkdir(dirname(file), { recursive: true })
    await writeJson(file, entry)
  }

  await rm(WEEKS_DIR, { recursive: true, force: true })
  await mkdir(WEEKS_DIR, { recursive: true })
  const weekIndex = []
  for (const wk of weeks.values()) {
    const list = [...wk.repos.values()].sort((a, b) => (b.starsToday ?? 0) - (a.starsToday ?? 0) || a.rank - b.rank)
    const summary = summarize([...wk.latest.values()])
    await writeJson(join(WEEKS_DIR, `${wk.week}.json`), { week: wk.week, from: wk.from, to: wk.to, days: wk.days, summary, repos: list })
    weekIndex.push({ week: wk.week, from: wk.from, to: wk.to, days: wk.days.length, repos: list.length, codeRepos: summary.codeRepos ?? 0 })
  }

  const history = {
    updatedAt: lastDay.generatedAt,
    days: days.map(d => ({ date: d.date, week: isoWeek(d.date), generatedAt: d.generatedAt, ...d.summary, languages: undefined })),
    weeks: weekIndex
  }
  // drop the undefined placeholder so the JSON stays flat
  for (const d of history.days) delete d.languages
  await writeJson(HISTORY_FILE, history)

  const repoIndex = [...repos.values()]
    .map(r => ({ name: r.name, date: r.latest.date }))
    .sort((a, b) => a.name.localeCompare(b.name))
  await writeJson(REPO_INDEX_FILE, repoIndex)

  // Baselines: every repository once, at its latest code-measured
  // appearance, so a repo that trended for a week does not count seven
  // times. Languages are GitHub's primary language for the repo. A language
  // gets a row once enough repos were measured; the rest are listed as
  // pending so the page can say how far off they are.
  const measured = [...repos.values()]
    .map(r => r.latest)
    .filter(hasCodeMetric)
  const byLanguage = new Map()
  for (const r of measured) {
    const key = r.language || 'Other'
    byLanguage.set(key, [...(byLanguage.get(key) || []), r])
  }
  const rows = [...byLanguage.entries()]
    .map(([language, list]) => baselineRow(language, list))
    .sort((a, b) => b.repos - a.repos || a.language.localeCompare(b.language))
  const codeDays = days.filter(d => d.repos.some(hasCodeMetric)).map(d => d.date)
  await writeJson(BASELINES_FILE, {
    updatedAt: lastDay.generatedAt,
    from: codeDays[0] ?? null,
    to: codeDays[codeDays.length - 1] ?? null,
    minRepos: MIN_BASELINE_REPOS,
    minCodeFiles: MIN_CODE_FILES,
    repos: measured.length,
    all: measured.length ? baselineRow('All languages', measured) : null,
    languages: rows.filter(r => r.repos >= MIN_BASELINE_REPOS),
    pending: rows.filter(r => r.repos < MIN_BASELINE_REPOS).map(({ language, repos }) => ({ language, repos })),
    method: codeScanConfig()
  })

  // The calibration corpus: every health-scored appearance of the trailing
  // retention window, kept raw (windowing, dedup and medians are the
  // consumer's job in rust/scripts/calibrate-health.mjs). Days without a
  // single health-scored repo — before health scoring shipped — drop out.
  const corpus = {
    updatedAt: lastDay.generatedAt,
    days: days
      .filter(d => d.date >= offsetDay(lastDay.date, -HEALTH_CORPUS_RETENTION_DAYS + 1))
      .map(d => ({
        date: d.date,
        // Which jscpd measured the day — the health shares carry that
        // version's exclusion rules (markup, data, text), so the consumer
        // can tell whether a value is comparable to a given score.
        // Absent on days recorded before this field existed.
        jscpdVersion: d.jscpdVersion ?? null,
        repos: d.repos
          .filter(r => r.health)
          .map(r => ({
            name: r.name,
            lines: r.health.size.lines,
            dimensions: Object.fromEntries(
              r.health.dimensions
                .filter(x => typeof x.value === 'number')
                .map(x => [x.id, x.value])
            )
          }))
      }))
      .filter(d => d.repos.length > 0)
  }
  await writeJson(HEALTH_CORPUS_FILE, corpus)

  await writeJson(LATEST_FILE, lastDay)
  return { days: days.length, repos: repos.size, weeks: weeks.size, measured: measured.length }
}
