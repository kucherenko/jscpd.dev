#!/usr/bin/env node
/**
 * Fetch GitHub trending repos, analyze each with jscpd v5, and write
 * data/trending.json for the site to consume at build time.
 *
 * Runs in the "Trending repos analysis" GitHub Actions workflow (daily),
 * or locally: node scripts/analyze-trending.mjs
 */
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_FILE = join(ROOT, 'data', 'trending.json')

const MAX_REPOS = 12
const MAX_REPO_SIZE_KB = 400_000 // skip repos over ~400 MB
const CLONE_TIMEOUT_MS = 240_000
const ANALYZE_TIMEOUT_MS = 300_000
const TOP_CLONES = 10
const TOP_FORMATS = 10

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
  const reportDir = join(dir, 'report')
  try {
    await exec('git', ['clone', '--depth', '1', '--single-branch', `https://github.com/${entry.name}.git`, src],
      { timeout: CLONE_TIMEOUT_MS, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
    const { stdout: sha } = await exec('git', ['-C', src, 'rev-parse', 'HEAD'])

    const started = Date.now()
    // jscpd exits 0 when no threshold is set; ignore vendored/generated code
    await exec('npx', ['-y', 'jscpd@5',
      '--reporters', 'json',
      '--output', reportDir,
      '--ignore', '**/node_modules/**,**/vendor/**,**/third_party/**,**/dist/**,**/build/**,**/*.min.js,**/*.map,**/package-lock.json,**/pnpm-lock.yaml',
      src
    ], { timeout: ANALYZE_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 })
    const durationMs = Date.now() - started

    const report = JSON.parse(await readFile(join(reportDir, 'jscpd-report.json'), 'utf8'))
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
      topClones
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const round2 = (n) => typeof n === 'number' ? Math.round(n * 100) / 100 : n

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
    console.log(`  → ${result.total.clones} clones, ${result.total.percentage}% duplicated lines in ${result.durationMs} ms`)
    repos.push(result)
  } catch (e) {
    console.log(`skip ${entry.name}: ${String(e.message || e).split('\n')[0]}`)
  }
}

if (repos.length < 3) {
  console.error(`only ${repos.length} repos analyzed — refusing to overwrite trending.json`)
  process.exit(1)
}

await writeFile(OUT_FILE, JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'github-trending-daily',
  repos
}, null, 1) + '\n')
console.log(`wrote ${OUT_FILE} with ${repos.length} repos`)
