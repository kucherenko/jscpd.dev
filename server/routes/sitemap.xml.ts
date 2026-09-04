// Replaces the docus layer's sitemap route (same path; the project's server
// dir is scanned first, so this handler wins). The layer version derives the
// site URL from hosting env vars only — absent on a Cloudflare Pages static
// deploy, which produced relative <loc> entries — and has no way to include
// routes that are not Nuxt Content pages (/support).
import { execFileSync } from 'node:child_process'
// Resolvable only through the nitro alias set in nuxt.config.ts.
import { queryCollection } from '@nuxt/content/server'
import { getSiteConfig } from '#site-config/server/composables'
// Bundled at build time: node:fs is a stub under the cloudflare preset.
import trendingHistory from '../../data/trending-history.json'
import trendingRepos from '../../data/trending-repos.json'

interface SitemapUrl {
  loc: string
  lastmod?: string
}

const COLLECTIONS = ['docs', 'landing']

// Routes registered via `pages:extend` in nuxt.config.ts, with the source
// file whose git history gives their lastmod.
const EXTRA_ROUTES: Array<{ loc: string, file: string }> = [
  { loc: '/support', file: 'pages/support.vue' },
]

const buildDate = new Date().toISOString().slice(0, 10)

// Trending pages are generated from data/ (see nuxt.config.ts); every day
// and repository gets its own URL, dated by the analysis that produced it.
function trendingUrls(): SitemapUrl[] {
  const days = (trendingHistory as { days: Array<{ date: string }> }).days
  const urls: SitemapUrl[] = [{ loc: '/trending', lastmod: days[days.length - 1]?.date }]
  for (const d of days.slice(0, -1)) urls.push({ loc: `/trending/${d.date}`, lastmod: d.date })
  for (const r of trendingRepos as Array<{ name: string, date: string }>) urls.push({ loc: `/trending/${r.name}`, lastmod: r.date })
  return urls
}

function gitLastmod(file: string): string {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : buildDate
  }
  catch {
    return buildDate
  }
}

export default defineEventHandler(async (event) => {
  const siteUrl = (getSiteConfig(event).url || 'https://jscpd.dev').replace(/\/+$/, '')
  const urls: SitemapUrl[] = []
  const seen = new Set<string>()

  for (const collection of COLLECTIONS) {
    let pages: Array<{ path?: string, stem?: string, extension?: string, meta?: Record<string, unknown> }> = []
    try {
      pages = await (queryCollection as unknown as (
        event: unknown,
        collection: string,
      ) => { all: () => Promise<typeof pages> })(event, collection).all()
    }
    catch (err) {
      console.error(`[sitemap] failed to query collection "${collection}":`, err)
      continue
    }

    for (const page of pages) {
      const path = page.path || '/'
      const meta = (page.meta || {}) as Record<string, unknown>
      if (meta.sitemap === false) continue
      if (path.endsWith('/.navigation') || path.includes('/.navigation/')) continue
      if (seen.has(path)) continue
      seen.add(path)

      const modifiedAt = typeof meta.modifiedAt === 'string' ? meta.modifiedAt.split('T')[0] : undefined
      const lastmod = modifiedAt || (page.stem ? gitLastmod(`content/${page.stem}.${page.extension || 'md'}`) : buildDate)
      urls.push({ loc: path, lastmod })
    }
  }

  for (const extra of EXTRA_ROUTES) {
    if (seen.has(extra.loc)) continue
    seen.add(extra.loc)
    urls.push({ loc: extra.loc, lastmod: gitLastmod(extra.file) })
  }

  for (const t of trendingUrls()) {
    const existing = urls.find(u => u.loc === t.loc)
    if (existing) { existing.lastmod = t.lastmod; continue }
    seen.add(t.loc)
    urls.push(t)
  }

  // Home first, then everything else in path order.
  urls.sort((a, b) => (a.loc === '/' ? -1 : b.loc === '/' ? 1 : a.loc.localeCompare(b.loc)))

  const entries = urls.map(u =>
    `  <url>\n    <loc>${escapeXml(siteUrl + (u.loc === '/' ? '/' : u.loc))}</loc>`
    + (u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : '')
    + `\n  </url>`,
  ).join('\n')

  setResponseHeader(event, 'content-type', 'application/xml')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`
})

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
