#!/usr/bin/env node
/**
 * Fetch GitHub trending repos, analyze each with jscpd v5, and write the
 * day's snapshot to data/trending/YYYY-MM-DD.json, then rebuild the derived
 * files (data/trending-history.json, data/trending/repos/**, data/trending.json)
 * the site consumes at build time.
 *
 * Runs in the "Trending repos analysis" GitHub Actions workflow (daily),
 * or locally: node scripts/analyze-trending.mjs
 */
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { buildIndex, makeSnapshot, round2, writeSnapshot } from './trending-lib.mjs'

const exec = promisify(execFile)

const MAX_REPOS = 12
const MAX_REPO_SIZE_KB = 400_000 // skip repos over ~400 MB
const CLONE_TIMEOUT_MS = 240_000
const ANALYZE_TIMEOUT_MS = 300_000
// --dashboard runs a dead-code scan (import-graph analysis) beside the clone
// scan, which is the slower of the two on a large JS/TS/Python tree — give
// it more room than the plain duplication run.
const DASHBOARD_TIMEOUT_MS = 480_000
const TOP_CLONES = 10
const TOP_FORMATS = 10
const TOP_SUMMARY = 10

const ghHeaders = {
  'user-agent': 'jscpd.dev-trending (+https://jscpd.dev)',
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
}

async function fetchTrending() {
  const res = await fetch('https://github.com/trending?since=daily', {
    headers: { 'user-agent': ghHeaders['user-agent'] }
  })
  if (!res.ok) throw new Error(`trending page HTTP ${res.status}`)
  const html = await res.text()
  const repos = []
  // each trending entry is an <article class="Box-row">…</article>
  for (const article of html.split('<article').slice(1)) {
    const m = article.match(/href="\/([\w.-]+\/[\w.-]+)"/)
    if (!m) continue
    const name = m[1]
    if (repos.some(r => r.name === name)) continue
    const desc = article.match(/<p class="col-9[^"]*">\s*([\s\S]*?)\s*<\/p>/)
    const lang = article.match(/itemprop="programmingLanguage">([^<]+)</)
    const starsToday = article.match(/([\d,]+) stars? today/)
    repos.push({
      name,
      description: desc ? decodeEntities(desc[1].replace(/<[^>]+>/g, '').trim()) : '',
      language: lang ? lang[1].trim() : null,
      starsToday: starsToday ? Number(starsToday[1].replace(/,/g, '')) : null
    })
    if (repos.length >= MAX_REPOS * 2) break // keep spares for skipped repos
  }
  if (repos.length < 5) throw new Error(`trending scrape found only ${repos.length} repos — page layout may have changed`)
  return repos
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
}

async function repoMeta(name) {
  const res = await fetch(`https://api.github.com/repos/${name}`, { headers: ghHeaders })
  if (!res.ok) return null
  const j = await res.json()
  return {
    stars: j.stargazers_count,
    sizeKb: j.size,
    defaultBranch: j.default_branch,
    description: j.description || '',
    language: j.language
  }
}

async function analyzeRepo(entry, meta) {
  const dir = await mkdtemp(join(tmpdir(), 'trending-'))
  const src = join(dir, 'src')
  const dupReportDir = join(dir, 'report-dup')
  const dashReportDir = join(dir, 'report-dash')
  try {
    await exec('git', ['clone', '--depth', '1', '--single-branch', `https://github.com/${entry.name}.git`, src],
      { timeout: CLONE_TIMEOUT_MS, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
    const { stdout: sha } = await exec('git', ['-C', src, 'rev-parse', 'HEAD'])

    // jscpd exits 0 when no threshold is set; ignore vendored/generated code
    const ignoreArgs = ['--ignore',
      '**/node_modules/**,**/vendor/**,**/third_party/**,**/dist/**,**/build/**,**/*.min.js,**/*.map,**/package-lock.json,**/pnpm-lock.yaml']

    const started = Date.now()
    // The plain duplication run (clone pairs, per-format table) and the
    // --dashboard run (health score, complexity hotspots, dead code) read
    // the same clone independently, so they run side by side rather than
    // doubling wall time. The dashboard run is best-effort: a repo whose
    // dead-code scan times out (a huge JS/TS/Python tree) still keeps its
    // duplication data instead of being dropped from the day entirely.
    const [dupRun, dashRun] = await Promise.allSettled([
      exec('npx', ['-y', 'jscpd@5', '--reporters', 'json', '--output', dupReportDir, ...ignoreArgs, src],
        { timeout: ANALYZE_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 }),
      exec('npx', ['-y', 'jscpd@5', '--dashboard', '--reporters', 'json', '--summary-top', String(TOP_SUMMARY),
        '--output', dashReportDir, ...ignoreArgs, src],
        { timeout: DASHBOARD_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 })
    ])
    const durationMs = Date.now() - started
    if (dupRun.status === 'rejected') throw dupRun.reason

    const report = JSON.parse(await readFile(join(dupReportDir, 'jscpd-report.json'), 'utf8'))
    const total = report.statistics?.total ?? {}
    const formats = Object.entries(report.statistics?.formats ?? {})
      .map(([format, s]) => ({
        format,
        sources: s.sources,
        lines: s.lines,
        clones: s.clones,
        duplicatedLines: s.duplicatedLines,
        percentage: round2(s.percentage)
      }))
      .sort((a, b) => b.clones - a.clones || b.lines - a.lines)
      .slice(0, TOP_FORMATS)

    const strip = (p) => p.startsWith(src) ? p.slice(src.length + 1) : p
    const topClones = (report.duplicates ?? [])
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, TOP_CLONES)
      .map(d => ({
        format: d.format,
        lines: d.lines,
        tokens: d.tokens,
        firstFile: { name: strip(d.firstFile.name), start: d.firstFile.start, end: d.firstFile.end },
        secondFile: { name: strip(d.secondFile.name), start: d.secondFile.start, end: d.secondFile.end }
      }))

    let dash = null
    if (dashRun.status === 'fulfilled') {
      try {
        dash = JSON.parse(await readFile(join(dashReportDir, 'jscpd-dashboard.json'), 'utf8'))
      } catch (e) {
        console.log(`  dashboard report unreadable for ${entry.name}: ${String(e.message || e).split('\n')[0]}`)
      }
    } else {
      console.log(`  dashboard analysis failed for ${entry.name}: ${String(dashRun.reason?.message || dashRun.reason).split('\n')[0]}`)
    }

    return {
      name: entry.name,
      url: `https://github.com/${entry.name}`,
      description: meta.description || entry.description,
      language: meta.language || entry.language,
      stars: meta.stars,
      starsToday: entry.starsToday,
      defaultBranch: meta.defaultBranch,
      headSha: sha.trim(),
      durationMs,
      total: {
        sources: total.sources,
        lines: total.lines,
        tokens: total.tokens,
        clones: total.clones,
        duplicatedLines: total.duplicatedLines,
        duplicatedTokens: total.duplicatedTokens,
        percentage: round2(total.percentage),
        percentageTokens: round2(total.percentageTokens)
      },
      formats,
      topClones,
      // null when the dashboard run failed/timed out — every consumer
      // treats these as optional so a slow repo still keeps its duplication
      // numbers instead of vanishing from the day entirely.
      health: dash?.health ?? null,
      complexity: dash?.complexity ?? null,
      deadCode: dash?.deadCode ?? null
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const candidates = await fetchTrending()
console.log(`trending: ${candidates.length} candidates`)
const repos = []
for (const entry of candidates) {
  if (repos.length >= MAX_REPOS) break
  const meta = await repoMeta(entry.name)
  if (!meta) { console.log(`skip ${entry.name}: no API metadata`); continue }
  if (meta.sizeKb > MAX_REPO_SIZE_KB) { console.log(`skip ${entry.name}: ${meta.sizeKb} KB exceeds size cap`); continue }
  try {
    console.log(`analyzing ${entry.name} (${meta.sizeKb} KB)…`)
    const result = await analyzeRepo(entry, meta)
    const health = result.health ? `, health ${result.health.score} (${result.health.grade})` : ', no health data'
    console.log(`  → ${result.total.clones} clones, ${result.total.percentage}% duplicated lines${health} in ${result.durationMs} ms`)
    repos.push(result)
  } catch (e) {
    console.log(`skip ${entry.name}: ${String(e.message || e).split('\n')[0]}`)
  }
}

if (repos.length < 3) {
  console.error(`only ${repos.length} repos analyzed — refusing to write a snapshot`)
  process.exit(1)
}

const file = await writeSnapshot(makeSnapshot({ generatedAt: new Date().toISOString(), repos }))
console.log(`wrote ${file} with ${repos.length} repos`)
const index = await buildIndex()
console.log(`rebuilt trending index: ${index.days} days, ${index.repos} repos`)
