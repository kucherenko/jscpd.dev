/**
 * How one repository is measured for the trending pages.
 *
 * Two clone scans per repository:
 *
 * - "all": every file jscpd recognises, with only dependencies, vendored code
 *   and build output ignored. This is the raw number the archive has carried
 *   since day one, so it stays comparable across days.
 * - "code": the repository's own source code. Tests, fixtures, docs, examples,
 *   translations, lockfiles and generated code are left out, and only
 *   programming-language formats count (no JSON, YAML, Markdown, CSS, HTML).
 *   This is the number the pages lead with, because the raw one is dominated
 *   by whatever large generated or copied file a repository happens to carry.
 *
 * Shared by analyze-trending.mjs (the daily run) and backfill-trending.mjs
 * (re-measuring past snapshots at their recorded commits).
 */
import { execFile } from 'node:child_process'
import { mkdtemp, open, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, relative } from 'node:path'
import { promisify } from 'node:util'
import { ALL_IGNORE, codeScanConfig, COMMENT_LINE, GENERATED_HEADER, groupClones, round2 } from './trending-rules.mjs'

export const exec = promisify(execFile)

export const ANALYZE_TIMEOUT_MS = 300_000
// --dashboard runs a dead-code scan (import-graph analysis) beside the clone
// scan, which is the slower of the two on a large JS/TS/Python tree. Give it
// more room than the plain duplication runs.
export const DASHBOARD_TIMEOUT_MS = 480_000
export const TOP_CLONES = 10
export const TOP_FORMATS = 10
export const TOP_SUMMARY = 10
// Locations listed per clone group and the excerpt size for the largest ones.
const MAX_LOCATIONS = 8
const EXCERPT_GROUPS = 3
export const EXCERPT_LINES = 10
const EXCERPT_COLUMNS = 160
// The jscpd that measures. The GitHub Actions run takes the released 5.x
// through npx; JSCPD_BIN overrides it locally (a path, optionally followed by
// arguments), e.g. JSCPD_BIN=~/.local/bin/jscpd node scripts/backfill-trending.mjs
const JSCPD = (process.env.JSCPD_BIN || 'npx -y jscpd@5').split(/\s+/)

export function jscpd(args, opts = {}) {
  const [bin, ...lead] = JSCPD
  return exec(bin, [...lead, ...args], { maxBuffer: 64 * 1024 * 1024, ...opts })
}

/** "jscpd 5.4.0" → "5.4.0"; the corpus compares versions, not banner lines. */
export async function jscpdVersion() {
  const { stdout } = await jscpd(['--version'])
  return stdout.trim().replace(/^jscpd\s+/, '')
}

const HEADER_BYTES = 2048
const HEADER_LINES = 30
// Below this size a one-line file is a re-export or a stub, not a bundle.
const MINIFIED_MIN_BYTES = 5000

// Extensions of the CODE_FORMATS above: which files the header check opens.
const CODE_EXTENSIONS = new Set((
  'as ada adb ads cls trigger apex apl astro awk sh bash ksh bas c h cfm cfc clj cljs cljc coffee cpp cc cxx hpp hh hxx '
  + 'cr cs d dart e elm erl hrl f f90 f95 fs fsx gd go groovy gradle hs hx idr java js mjs cjs jsx jl kt kts lisp el ls '
  + 'lua m mm ml mli oz pas pp pl pm php pls pks pkb ps1 psm1 pro purs py pyw q qs r rkt res re rb rs sas scala scm st '
  + 'sol sql svelte swift tcl tsx ts mts cts uc vb v sv vhd vhdl vue wgsl wl zig'
).split(' '))
const WALK_SKIP = new Set(['.git', 'node_modules', 'bower_components', 'vendor', 'third_party', 'dist', 'target', '__pycache__'])
const MAX_WALK_FILES = 200_000

/**
 * Source files whose header says they were generated, plus one-line files
 * big enough to be minified bundles. Paths are relative to `root`.
 */
export async function detectGeneratedFiles(root) {
  const found = []
  let scanned = 0
  async function walk(dir) {
    let entries
    try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (scanned >= MAX_WALK_FILES) return
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!WALK_SKIP.has(entry.name)) await walk(path)
        continue
      }
      if (!entry.isFile() || !CODE_EXTENSIONS.has(extname(entry.name).slice(1).toLowerCase())) continue
      scanned += 1
      const reason = await generatedReason(path)
      if (reason) found.push({ path: relative(root, path), reason })
    }
  }
  await walk(root)
  found.sort((a, b) => a.path.localeCompare(b.path))
  return { files: found, scanned }
}

async function generatedReason(path) {
  let handle
  try {
    handle = await open(path)
    const buffer = Buffer.alloc(HEADER_BYTES)
    const { bytesRead } = await handle.read(buffer, 0, HEADER_BYTES, 0)
    const head = buffer.subarray(0, bytesRead).toString('utf8')
    if (head.includes('\0')) return null
    const lines = head.split('\n', HEADER_LINES)
    if (lines.some(line => COMMENT_LINE.test(line) && GENERATED_HEADER.test(line))) return 'header'
    if (!head.includes('\n') && (await handle.stat()).size >= MINIFIED_MIN_BYTES) return 'minified'
    return null
  } catch {
    return null
  } finally {
    await handle?.close()
  }
}

/**
 * The first lines of a clone, read from the checked-out file so a reader sees
 * the actual code; falls back to the fragment jscpd recorded. Common
 * indentation is removed and long lines are cut.
 */
export async function excerpt(root, file, fragment) {
  let lines
  try {
    const text = await readFile(join(root, cleanName(file.name)), 'utf8')
    lines = text.split('\n').slice(file.start - 1, file.end)
  } catch {
    lines = (fragment || '').split('\n')
  }
  const total = lines.length
  lines = lines.slice(0, EXCERPT_LINES).map(l => l.replace(/\t/g, '    ').replace(/\s+$/, ''))
  const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length), Infinity)
  lines = lines.map(l => l.slice(Number.isFinite(indent) ? indent : 0))
    .map(l => l.length > EXCERPT_COLUMNS ? `${l.slice(0, EXCERPT_COLUMNS - 1)}…` : l)
  return { lines, total }
}

// Cross-format sources carry a block suffix (file.md:markdown, file.vue:script)
// that is not part of the real path.
const cleanName = name => name.replace(/:[a-z][\w-]*$/, '')

const normalise = lines => lines.map(l => l.replace(/\s+/g, ' ').trim()).join('\n')

async function readReport(dir, file) {
  return JSON.parse(await readFile(join(dir, file), 'utf8'))
}

function totals(report) {
  const t = report.statistics?.total ?? {}
  return {
    sources: t.sources,
    lines: t.lines,
    tokens: t.tokens,
    clones: t.clones,
    duplicatedLines: t.duplicatedLines,
    duplicatedTokens: t.duplicatedTokens,
    percentage: round2(t.percentage),
    percentageTokens: round2(t.percentageTokens)
  }
}

function formatTable(report) {
  return Object.entries(report.statistics?.formats ?? {})
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
}

async function topClones(report, src) {
  const strip = p => p.startsWith(src) ? p.slice(src.length + 1) : p
  const groups = groupClones(report.duplicates ?? [], strip).slice(0, TOP_CLONES)
  const out = []
  for (const [i, g] of groups.entries()) {
    const location = ({ name, start, end }) => ({ name, start, end })
    const entry = {
      format: g.format,
      lines: g.lines,
      tokens: g.tokens,
      copies: g.copies,
      first: location(g.first),
      others: g.others.slice(0, MAX_LOCATIONS).map(location)
    }
    if (i < EXCERPT_GROUPS) {
      entry.excerpt = await excerpt(src, g.first, g.fragment)
      // The second copy is shown beside the first only when it reads
      // differently (comments, formatting); identical text is shown once.
      // The first line is left out of the comparison: a block usually starts
      // mid-line, after a token that differs between the copies.
      const second = await excerpt(src, g.others[0])
      if (normalise(second.lines.slice(1)) !== normalise(entry.excerpt.lines.slice(1))) entry.excerptSecond = second
    }
    out.push(entry)
  }
  return out
}

/**
 * Measure a checked-out repository. Returns the fields a snapshot's repo entry
 * carries beyond its GitHub metadata. The dashboard run (health score,
 * complexity, dead code) feeds the health calibration corpus and is
 * best-effort: a repo whose dead-code scan times out keeps its clone numbers.
 */
export async function scanRepo(src, { dashboard = true, log = () => {} } = {}) {
  const work = await mkdtemp(join(tmpdir(), 'trending-scan-'))
  try {
    const started = Date.now()
    const generated = await detectGeneratedFiles(src)
    const codeConfig = join(work, 'code.jscpd.json')
    await writeFile(codeConfig, JSON.stringify(codeScanConfig(generated.files.map(f => f.path))))
    const allDir = join(work, 'all')
    const codeDir = join(work, 'code')
    const dashDir = join(work, 'dash')

    // The scans read the same checkout independently, so they run side by
    // side rather than tripling wall time.
    const [allRun, codeRun, dashRun] = await Promise.allSettled([
      jscpd(['--reporters', 'json', '--output', allDir, '--ignore', ALL_IGNORE.join(','), src], { timeout: ANALYZE_TIMEOUT_MS }),
      jscpd(['--reporters', 'json', '--output', codeDir, '-c', codeConfig, src], { timeout: ANALYZE_TIMEOUT_MS }),
      dashboard
        ? jscpd(['--dashboard', '--reporters', 'json', '--summary-top', String(TOP_SUMMARY), '--output', dashDir,
            '--ignore', ALL_IGNORE.join(','), src], { timeout: DASHBOARD_TIMEOUT_MS })
        : Promise.reject(new Error('dashboard run disabled'))
    ])
    const durationMs = Date.now() - started
    if (allRun.status === 'rejected') throw allRun.reason

    const all = await readReport(allDir, 'jscpd-report.json')
    const result = {
      durationMs,
      total: totals(all),
      formats: formatTable(all),
      topClones: await topClones(all, src),
      code: null,
      health: null,
      complexity: null,
      deadCode: null
    }

    if (codeRun.status === 'fulfilled') {
      const report = await readReport(codeDir, 'jscpd-report.json')
      result.code = {
        ...totals(report),
        formats: formatTable(report),
        topClones: await topClones(report, src),
        // What the header check removed; the glob rules above need no list.
        generated: {
          files: generated.files.length,
          minified: generated.files.filter(f => f.reason === 'minified').length,
          sample: generated.files.slice(0, 20).map(f => f.path)
        }
      }
    } else {
      log(`code scan failed: ${firstLine(codeRun.reason)}`)
    }

    if (dashRun.status === 'fulfilled') {
      try {
        const dash = await readReport(dashDir, 'jscpd-dashboard.json')
        result.health = dash.health ?? null
        result.complexity = dash.complexity ?? null
        result.deadCode = dash.deadCode ?? null
      } catch (e) {
        log(`dashboard report unreadable: ${firstLine(e)}`)
      }
    } else if (dashboard) {
      log(`dashboard analysis failed: ${firstLine(dashRun.reason)}`)
    }
    return result
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

export const firstLine = e => String(e?.message || e).split('\n')[0]

/** Shallow clone of a repository's default branch; returns the checkout path. */
export async function cloneHead(name, dir, { timeout }) {
  const src = join(dir, 'src')
  await exec('git', ['clone', '--depth', '1', '--single-branch', `https://github.com/${name}.git`, src],
    { timeout, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
  const { stdout } = await exec('git', ['-C', src, 'rev-parse', 'HEAD'])
  return { src, sha: stdout.trim() }
}

/** Shallow checkout of one recorded commit, for re-measuring a past day. */
export async function cloneCommit(name, sha, dir, { timeout }) {
  const src = join(dir, 'src')
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  await exec('git', ['init', '-q', src], { env })
  await exec('git', ['-C', src, 'remote', 'add', 'origin', `https://github.com/${name}.git`], { env })
  await exec('git', ['-C', src, 'fetch', '-q', '--depth', '1', 'origin', sha], { timeout, env })
  await exec('git', ['-C', src, 'checkout', '-q', 'FETCH_HEAD'], { env })
  return { src, sha }
}
