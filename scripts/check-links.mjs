#!/usr/bin/env node
/**
 * Lists internal links in content/, components/ and pages/ that point at no
 * page: a content file, a registered route or a public file. Run after
 * moving or renaming pages:
 *
 *   node scripts/check-links.mjs
 *
 * Exit code 1 when a dead link is found. Anchors are not checked.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

// content file -> URL, the way Nuxt Content does it: numeric prefixes drop, index.md is the directory
const pages = new Set(['/', '/trending', '/support', '/404'])
for (const f of walk(join(root, 'content')).filter(f => f.endsWith('.md'))) {
  const rel = relative(join(root, 'content'), f).replace(/\.md$/, '')
  const parts = rel.split('/').map(s => s.replace(/^\d+\./, ''))
  if (parts[parts.length - 1] === 'index') parts.pop()
  pages.add('/' + parts.join('/'))
}
// trending days and repos are prerendered from data/
try {
  const history = JSON.parse(readFileSync(join(root, 'data/trending-history.json'), 'utf8'))
  for (const d of history.days) pages.add(`/trending/${d.date}`)
  for (const w of history.weeks ?? []) pages.add(`/trending/week/${w.week}`)
  const repos = JSON.parse(readFileSync(join(root, 'data/trending-repos.json'), 'utf8'))
  for (const r of repos) pages.add(`/trending/${r.name}`)
} catch {}
// redirects count as reachable
const config = readFileSync(join(root, 'nuxt.config.ts'), 'utf8')
for (const m of config.matchAll(/"(\/[^"]+)": \{ redirect/g)) pages.add(m[1])

const sources = ['content', 'components', 'pages'].flatMap(d => walk(join(root, d)))
  .filter(f => /\.(md|vue|ts)$/.test(f))
const linkRe = /(?:\]\(|href="|href='|\bto[:=]\s*["']|to="|to: )(\/[^\s"')#?]*)/g
const dead = []
let total = 0
for (const f of sources) {
  const text = readFileSync(f, 'utf8')
  for (const m of text.matchAll(linkRe)) {
    const url = m[1].replace(/\/$/, '') || '/'
    total++
    if (pages.has(url)) continue
    if (url.startsWith('/examples/') || url.startsWith('/images/') || url.startsWith('/video/')) {
      if (existsSync(join(root, 'public', url))) continue
    }
    if (url.startsWith('/_') || url.startsWith('/api/')) continue
    dead.push(`${relative(root, f)}: ${url}`)
  }
}
// Every routeRules redirect must also be in public/_redirects: Cloudflare Pages
// reads the file, the dev server reads the config. The file may hold more.
const ruleSet = new Set([...config.matchAll(/"(\/[^"]+)": \{ redirect: \{ to: "(\/[^"]+)", statusCode: (\d+) \} \}/g)].map(m => `${m[1]} ${m[2]} ${m[3]}`))
const fileSet = new Set(readFileSync(join(root, 'public/_redirects'), 'utf8').split('\n').filter(l => l && !l.startsWith('#')))
for (const r of ruleSet) if (!fileSet.has(r)) dead.push(`public/_redirects: missing "${r}" (present in nuxt.config.ts routeRules)`)
const unique = [...new Set(dead)].sort()
console.log(`${total} internal links checked, ${unique.length} dead`)
for (const d of unique) console.log('  ' + d)
process.exit(unique.length ? 1 : 0)
