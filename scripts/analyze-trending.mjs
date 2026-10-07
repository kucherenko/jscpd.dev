#!/usr/bin/env node
/**
 * Fetch GitHub trending repos, measure each with jscpd v5 (see
 * trending-scan.mjs for what is measured), write the day's snapshot to
 * data/trending/YYYY-MM-DD.json, then rebuild the derived files
 * (data/trending-history.json, data/trending/repos/**, data/trending.json,
 * data/trending-baselines.json, data/trending/weeks/**) the site consumes at
 * build time.
 *
 * Runs in the "Trending repos analysis" GitHub Actions workflow (daily),
 * or locally: node scripts/analyze-trending.mjs
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildIndex, makeSnapshot, writeSnapshot } from './trending-lib.mjs'
import { cloneHead, firstLine, jscpdVersion, scanRepo } from './trending-scan.mjs'

const MAX_REPOS = 12
const MAX_REPO_SIZE_KB = 400_000 // skip repos over ~400 MB
const CLONE_TIMEOUT_MS = 240_000

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
  try {
    const { src, sha } = await cloneHead(entry.name, dir, { timeout: CLONE_TIMEOUT_MS })
    const scan = await scanRepo(src, { log: line => console.log(`  ${line}`) })
    return {
      name: entry.name,
      url: `https://github.com/${entry.name}`,
      description: meta.description || entry.description,
      language: meta.language || entry.language,
      stars: meta.stars,
      starsToday: entry.starsToday,
      defaultBranch: meta.defaultBranch,
      headSha: sha,
      // code is null when its scan failed, health/complexity/deadCode when
      // the dashboard run did; every consumer treats them as optional so a
      // slow repo keeps its raw numbers instead of vanishing from the day.
      ...scan
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const candidates = await fetchTrending()
console.log(`trending: ${candidates.length} candidates`)
// Which jscpd measures today — recorded on the snapshot so the health
// corpus can say which exclusion rules (markup, data, text) its values
// carry. Read once here; every invocation below resolves the same jscpd@5
// within one run.
const version = await jscpdVersion()
console.log(`jscpd: ${version}`)
const repos = []
for (const entry of candidates) {
  if (repos.length >= MAX_REPOS) break
  const meta = await repoMeta(entry.name)
  if (!meta) { console.log(`skip ${entry.name}: no API metadata`); continue }
  if (meta.sizeKb > MAX_REPO_SIZE_KB) { console.log(`skip ${entry.name}: ${meta.sizeKb} KB exceeds size cap`); continue }
  try {
    console.log(`analyzing ${entry.name} (${meta.sizeKb} KB)…`)
    const result = await analyzeRepo(entry, meta)
    const code = result.code ? `, code ${result.code.percentage}% over ${result.code.sources} files` : ', no code scan'
    const health = result.health ? `, health ${result.health.score} (${result.health.grade})` : ', no health data'
    console.log(`  → ${result.total.clones} clones, ${result.total.percentage}% duplicated lines${code}${health} in ${result.durationMs} ms`)
    repos.push(result)
  } catch (e) {
    console.log(`skip ${entry.name}: ${firstLine(e)}`)
  }
}

if (repos.length < 3) {
  console.error(`only ${repos.length} repos analyzed — refusing to write a snapshot`)
  process.exit(1)
}

const file = await writeSnapshot(makeSnapshot({ generatedAt: new Date().toISOString(), repos, jscpdVersion: version }))
console.log(`wrote ${file} with ${repos.length} repos`)
const index = await buildIndex()
console.log(`rebuilt trending index: ${index.days} days, ${index.repos} repos`)
