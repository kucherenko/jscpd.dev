#!/usr/bin/env node
// Checks that every project on the landing page logo wall still runs jscpd.
//
//   GITHUB_TOKEN=... node scripts/check-users.mjs [list.ts]
//
// For each entry of data/users.ts it reads the file the tile links to and
// fails when the file is gone, no longer names jscpd, or switches jscpd off
// (VALIDATE_JSCPD false for Super Linter, COPYPASTE_JSCPD under
// DISABLE_LINTERS for MegaLinter). The "Logo wall check" workflow runs it on
// pull requests that change the list, every Monday and on demand. Without a
// token GitHub allows 60 requests an hour, enough for a run by hand.

import { readFile, appendFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = await readFile(process.argv[2] || join(root, 'data/users.ts'), 'utf8')
const entries = [...source.matchAll(/name: '([^']+)'[\s\S]*?url: '([^']+)'/g)]
  .map(([, name, url]) => ({ name, url }))

const headers = {
  accept: 'application/vnd.github.raw+json',
  'user-agent': 'jscpd.dev',
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
}

// Lines that are comments in YAML, env files, shell or JavaScript; a
// commented-out VALIDATE_JSCPD: false does not switch anything off.
const isComment = line => /^\s*(#|\/\/)/.test(line)

function switchedOff(text) {
  const lines = text.split('\n').filter(line => !isComment(line))
  if (lines.some(line => /VALIDATE_JSCPD["']?\s*[:=]\s*["']?false/i.test(line))) {
    return 'VALIDATE_JSCPD is false'
  }
  // MegaLinter: DISABLE_LINTERS: [A, COPYPASTE_JSCPD] or a YAML list under it.
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*DISABLE_LINTERS\s*:\s*(.*)$/)
    if (!m) continue
    const listed = [m[1]]
    for (let j = i + 1; j < lines.length && /^\s*-\s*/.test(lines[j]); j++) listed.push(lines[j])
    if (listed.some(item => /COPYPASTE_JSCPD/.test(item))) return 'COPYPASTE_JSCPD is in DISABLE_LINTERS'
  }
  return null
}

async function check({ url }) {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/)
  if (!m) return 'the link is not a GitHub file link'
  const [, owner, repo, ref, path] = m
  const query = ref === 'HEAD' ? '' : `?ref=${encodeURIComponent(ref)}`
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}${query}`, { headers })
  if (!res.ok) return `GitHub answered ${res.status} for the file`
  const text = await res.text()
  if (!/jscpd/i.test(path) && !/jscpd/i.test(text)) return 'the file no longer names jscpd'
  return switchedOff(text)
}

const results = []
for (const entry of entries) {
  const problem = await check(entry)
  results.push({ ...entry, problem })
  console.log(`${problem ? 'FAIL' : 'ok  '}  ${entry.name}: ${problem || entry.url}`)
}

const failed = results.filter(r => r.problem)
console.log(`\n${entries.length - failed.length} of ${entries.length} projects still run jscpd`)

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = results.map(r => `| ${r.name} | [${r.url.split('/').slice(3, 5).join('/')}](${r.url}) | ${r.problem ? `❌ ${r.problem}` : '✅'} |`)
  await appendFile(process.env.GITHUB_STEP_SUMMARY, [
    `### Logo wall: ${entries.length - failed.length} of ${entries.length} projects still run jscpd`,
    '',
    '| Tile | Repository | Check |',
    '| --- | --- | --- |',
    ...rows,
    ''
  ].join('\n'))
}

if (entries.length === 0) throw new Error('no entries found in data/users.ts')
if (failed.length) process.exit(1)
