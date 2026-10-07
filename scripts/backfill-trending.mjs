#!/usr/bin/env node
/**
 * Re-measure past snapshots with the current scan (trending-scan.mjs): check
 * out each repository at the commit the day recorded and replace its clone
 * numbers, so days measured before the code-only scan existed get the same
 * fields as new ones. Health, complexity and dead code stay as recorded; the
 * dashboard run is not repeated.
 *
 *   node scripts/backfill-trending.mjs                 # every repo without a code scan
 *   node scripts/backfill-trending.mjs --since 2026-10-01
 *   node scripts/backfill-trending.mjs --date 2026-10-06 --repo caddyserver/caddy
 *   node scripts/backfill-trending.mjs --latest-only    # each repo once, at its last appearance
 *   node scripts/backfill-trending.mjs --force          # re-measure repos that already have one
 *
 * A commit that no longer exists on GitHub (history rewritten) leaves the
 * old entry untouched. Set JSCPD_BIN to measure with a local jscpd.
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildIndex, readSnapshots, summarize, writeSnapshot } from './trending-lib.mjs'
import { cloneCommit, firstLine, jscpdVersion, scanRepo } from './trending-scan.mjs'

const FETCH_TIMEOUT_MS = 240_000

const args = process.argv.slice(2)
const option = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1] }
const since = option('--since')
const date = option('--date')
const only = option('--repo')
const latestOnly = args.includes('--latest-only')
const force = args.includes('--force')
const limit = Number(option('--limit') || Infinity)

const version = await jscpdVersion()
console.log(`jscpd: ${version}`)

const days = (await readSnapshots())
  .filter(d => (!since || d.date >= since) && (!date || d.date === date))
const lastSeen = new Map()
for (const d of days) for (const r of d.repos) lastSeen.set(r.name, d.date)

let done = 0
let changed = 0
for (const day of days) {
  let dayChanged = false
  for (const repo of day.repos) {
    if (done >= limit) break
    if (only && repo.name !== only) continue
    if (latestOnly && lastSeen.get(repo.name) !== day.date) continue
    if (repo.code && !force) continue
    done += 1
    const dir = await mkdtemp(join(tmpdir(), 'trending-backfill-'))
    try {
      console.log(`${day.date} ${repo.name} @ ${repo.headSha.slice(0, 7)}…`)
      const { src } = await cloneCommit(repo.name, repo.headSha, dir, { timeout: FETCH_TIMEOUT_MS })
      const scan = await scanRepo(src, { dashboard: false, log: line => console.log(`  ${line}`) })
      // The clone numbers are replaced wholesale: one jscpd version measured
      // everything the page shows together. The dashboard fields keep the
      // day's values.
      Object.assign(repo, {
        durationMs: scan.durationMs,
        total: scan.total,
        formats: scan.formats,
        topClones: scan.topClones,
        code: scan.code,
        measuredAt: new Date().toISOString(),
        jscpdVersion: version
      })
      dayChanged = true
      changed += 1
      const code = scan.code ? `code ${scan.code.percentage}% over ${scan.code.sources} files, ${scan.code.generated.files} generated skipped` : 'no code scan'
      console.log(`  → all ${scan.total.percentage}%, ${code}, ${scan.durationMs} ms`)
    } catch (e) {
      console.log(`  skip: ${firstLine(e)}`)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  }
  if (dayChanged) {
    day.summary = summarize(day.repos)
    await writeSnapshot(day)
    console.log(`wrote ${day.date}`)
  }
}

console.log(`${changed} of ${done} repo entries re-measured`)
if (changed) {
  const index = await buildIndex()
  console.log(`rebuilt trending index: ${index.days} days, ${index.repos} repos`)
}
