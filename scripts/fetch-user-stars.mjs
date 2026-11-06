#!/usr/bin/env node
// Refreshes the GitHub stars shown on the landing page logo wall.
//
//   GITHUB_TOKEN=... node scripts/fetch-user-stars.mjs
//
// Reads the repositories from the `url` fields of data/users.ts and writes
// data/users-stars.json. The trending workflow runs it every day; without a
// token GitHub allows 60 requests an hour, enough for a run by hand. A
// repository that fails to answer keeps the count it had.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const usersFile = join(root, 'data/users.ts')
const starsFile = join(root, 'data/users-stars.json')

const source = await readFile(usersFile, 'utf8')
const repos = [...new Set(
  [...source.matchAll(/url: 'https:\/\/github\.com\/([^/']+\/[^/']+)/g)].map(m => m[1])
)]

let previous = {}
try {
  previous = JSON.parse(await readFile(starsFile, 'utf8')).stars || {}
} catch {
  // first run
}

const headers = {
  accept: 'application/vnd.github+json',
  'user-agent': 'jscpd.dev',
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
}

const stars = {}
let fetched = 0
for (const repo of repos) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers })
  if (res.ok) {
    stars[repo] = (await res.json()).stargazers_count
    fetched++
  } else {
    console.warn(`${repo}: GitHub answered ${res.status}, keeping ${previous[repo] ?? 'no count'}`)
    if (previous[repo] !== undefined) stars[repo] = previous[repo]
  }
}

if (fetched === 0) throw new Error('GitHub answered no repository, data/users-stars.json left as it was')

const updated = new Date().toISOString().slice(0, 10)
await writeFile(starsFile, JSON.stringify({ updated, stars }, null, 2) + '\n')
console.log(`stars of ${fetched} of ${repos.length} repositories written to data/users-stars.json`)
