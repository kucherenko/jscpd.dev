#!/usr/bin/env node
/**
 * Writes content/4.reference/1.cli.md from `jscpd --help`, so the option
 * reference cannot drift from the release. Run it after every jscpd release:
 *
 *   JSCPD_BIN=jscpd node scripts/sync-cli-reference.mjs [path/to/cli.rs]
 *
 * The optional cli.rs (rust/crates/cpd/src/cli.rs of the release) gives the
 * config keys: every field of `ConfigFile`, in camelCase. Without it the
 * "Config key" column is left out.
 *
 * Groups are a hand-kept map below. A flag that is not in the map lands in
 * "Other options" and is reported on stderr, which is the drift signal.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

// JSCPD_BIN may carry arguments, e.g. "npx -y jscpd@5.4.0"
const [bin, ...binArgs] = (process.env.JSCPD_BIN || 'jscpd').split(/\s+/)
const run = args => execFileSync(bin, [...binArgs, ...args], { encoding: 'utf8' })
const help = run(['--help'])
const version = run(['--version']).trim().replace(/^jscpd\s+/, '')

// ---- parse clap's help: an option line, then indented description lines ----
const options = []
let current = null
for (const raw of help.split('\n')) {
  // clap aligns options with a short form at two spaces and the others at six
  const m = raw.match(/^ {2,6}(?:(-[A-Za-z]), )?(--[a-z][a-z-]*)(?: (\[?<[^>]+>\]?))?\s*$/)
  if (m) {
    current = { short: m[1] || '', long: m[2], value: m[3] || '', description: [] }
    options.push(current)
    continue
  }
  if (current && /^ {10}\S/.test(raw)) current.description.push(raw.trim())
}
if (options.length < 40) {
  console.error(`parsed only ${options.length} options from --help; the format may have changed`)
  process.exit(1)
}

// ---- config keys from the ConfigFile struct ----
let configKeys = null
if (process.argv[2]) {
  const src = readFileSync(process.argv[2], 'utf8')
  const struct = src.slice(src.indexOf('pub struct ConfigFile'))
  const body = struct.slice(0, struct.indexOf('\n}'))
  configKeys = new Set([...body.matchAll(/pub ([a-z_]+):/g)].map(m => m[1]))
}
const camel = flag => flag.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const snake = flag => flag.replace(/^--/, '').replace(/-/g, '_')
// flags whose config key is the same setting under another name
const KEY_ALIASES = { '--skip-comments': 'mode' }
function configKey(flag) {
  if (!configKeys) return null
  if (KEY_ALIASES[flag]) return `\`${camel('--' + KEY_ALIASES[flag])}\``
  return configKeys.has(snake(flag)) ? `\`${camel(flag)}\`` : '—'
}

// ---- defaults, read from the description text ----
function defaultOf(opt) {
  const d = opt.description.join(' ')
  const m = d.match(/[Dd]efault(?: code)?: ([^)]+?)(?:[).;]|$)/) || d.match(/\((?:the )?default ([^)]+)\)/) || d.match(/default N: (\d+)/)
  if (m) return m[1].trim()
  if (/the default (\d+(?:\.\d+)?) means/.test(d)) return RegExp.$1
  return '—'
}

// ---- groups ----
const GROUPS = [
  ['What to scan', ['--pattern', '--format', '--ignore', '--ignore-pattern', '--no-gitignore', '--follow-symlinks', '--max-size', '--formats-exts', '--formats-names', '--cross-formats', '--skip-local', '--skip-isolated', '--config', '--list', '--debug']],
  ['Clone size and kinds', ['--min-tokens', '--min-lines', '--max-lines', '--mode', '--skip-comments', '--ignore-case', '--ignore-identifiers', '--ignore-literals', '--ignore-annotations', '--max-gap-lines', '--similarity', '--kind']],
  ['Semantic clones', ['--semantic', '--semantic-scope', '--semantic-provider', '--semantic-download', '--semantic-rebuild-cache', '--semantic-threshold', '--semantic-same-threshold', '--semantic-model', '--semantic-models', '--semantic-url']],
  ['Reports', ['--reporters', '--output', '--absolute', '--blame', '--sarif-error-tokens', '--no-colors', '--silent', '--no-tips']],
  ['Gates and exit codes', ['--threshold', '--exit-code', '--baseline', '--update-baseline', '--fail-on-new-clones', '--fail-on-empty', '--baseline-from-ref']],
  ['Other modes of the same binary', ['--dashboard', '--health', '--health-input', '--dead-code', '--dead-code-categories', '--min-confidence', '--rust-diagnostics', '--entry', '--include-tests', '--include-entry-exports', '--complexity', '--summary', '--summary-top', '--summary-by', '--history', '--history-since', '--history-every', '--history-limit', '--compare', '--mcp', '--lsp', '--lsp-analyses']],
  ['Runtime', ['--workers', '--help', '--version']],
]
const placed = new Set(GROUPS.flatMap(([, flags]) => flags))
const unplaced = options.filter(o => !placed.has(o.long)).map(o => o.long)
if (unplaced.length) {
  console.error(`flags not in any group (add them to GROUPS in ${process.argv[1]}): ${unplaced.join(' ')}`)
  GROUPS.push(['Other options', unplaced])
}
const missing = placed.size && GROUPS.flatMap(([, f]) => f).filter(f => !options.some(o => o.long === f))
if (missing.length) console.error(`flags in GROUPS that --help no longer has: ${missing.join(' ')}`)

const esc = s => s.replace(/\|/g, '\\|')
const byLong = Object.fromEntries(options.map(o => [o.long, o]))
const lines = []
lines.push('---')
lines.push('title: CLI options')
lines.push(`description: Every flag of the jscpd command line, with its config key and default, generated from the help text of jscpd ${version}.`)
lines.push('navigation:')
lines.push('  icon: i-lucide-terminal')
lines.push('---')
lines.push('')
lines.push(`<!-- Generated by scripts/sync-cli-reference.mjs from \`jscpd --help\` of jscpd ${version}. Edit the script or the help text in the jscpd repository, not this file. -->`)
lines.push('')
lines.push(`This page lists every option of \`jscpd ${version}\`, in the words of \`jscpd --help\`. The same settings go into [the config file](/reference/config-file) under the key in the second column; a flag on the command line wins over the file. Flags that take no value are \`true\` in the file. \`jscpd --debug\` prints the merged configuration and exits, which is the quickest way to see what a run would use.`)
lines.push('')
lines.push('```bash [Terminal]')
lines.push('jscpd [OPTIONS] [PATH]...')
lines.push('```')
lines.push('')
lines.push('`PATH` is one or more files or directories to scan; the current directory when left out.')
lines.push('')
for (const [title, flags] of GROUPS) {
  lines.push(`## ${title}`)
  lines.push('')
  lines.push(configKeys ? '| Flag | Config key | What it does | Default |' : '| Flag | What it does | Default |')
  lines.push(configKeys ? '|---|---|---|---|' : '|---|---|---|')
  for (const f of flags) {
    const o = byLong[f]
    if (!o) continue
    const name = [o.short ? `\`${o.short}\`, ` : '', `\`${o.long}\``, o.value ? ` \`${o.value}\`` : ''].join('')
    const cells = [name]
    if (configKeys) cells.push(configKey(o.long))
    cells.push(esc(o.description.join(' ')), esc(defaultOf(o)))
    lines.push(`| ${cells.join(' | ')} |`)
  }
  lines.push('')
}
lines.push('## See also')
lines.push('')
lines.push('- [The config file](/reference/config-file): where jscpd looks for `.jscpd.json`, the `package.json` form, inline markers.')
lines.push('- [Exit codes](/reference/exit-codes): what `--threshold`, `--exit-code`, `--fail-on-new-clones` and `--fail-on-empty` do to the exit status.')
lines.push('- [GitHub Action](/reference/github-action): the same options as action inputs.')
lines.push('')
writeFileSync(new URL('../content/4.reference/1.cli.md', import.meta.url), lines.join('\n'))
console.log(`wrote content/4.reference/1.cli.md: ${options.length} options, jscpd ${version}`)
