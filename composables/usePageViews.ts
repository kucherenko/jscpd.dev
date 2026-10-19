// Page views of the blog posts, the docs pages and the trending pages from
// Cloudflare Web Analytics, as scripts/analytics-snapshot.mjs stores them in
// data/analytics/months: one file per month, each day's views and visits per
// path, under `posts`, `docs` and `trending`. The files are imported lazily
// and the prerendered pages carry the sums in their payload.

/** [views, visits] */
export type PageCount = [number, number]

export interface DayRecord {
  posts: Record<string, PageCount>
  // Missing on the days stored before the docs pages or the trending pages
  // were counted, and on the days with no exact answer about them.
  docs?: Record<string, PageCount>
  trending?: Record<string, PageCount>
}

export interface MonthFile { days: Record<string, DayRecord> }

export interface PageViews { views: number, visits: number }

// Raise it to keep small counts off the pages.
export const MIN_VIEWS_SHOWN = 1

const monthModules = import.meta.glob<MonthFile>('../data/analytics/months/*.json', { import: 'default' })

/** All-time views and visits of the given paths; a path never visited counts 0. */
export async function loadPageViews(paths: string[]): Promise<Record<string, PageViews>> {
  const out: Record<string, PageViews> = Object.fromEntries(paths.map(p => [p, { views: 0, visits: 0 }]))
  for (const key of Object.keys(monthModules).sort()) {
    const month = await monthModules[key]!()
    for (const record of Object.values(month.days)) {
      for (const counts of [record.posts, record.docs, record.trending]) {
        for (const [path, [views, visits]] of Object.entries(counts ?? {})) {
          const row = out[path]
          if (!row) continue
          row.views += views
          row.visits += visits
        }
      }
    }
  }
  return out
}

export const viewsLabel = (n: number) => `${num(n)} ${n === 1 ? 'view' : 'views'}`

/**
 * "N views" of one page for its header, '' below MIN_VIEWS_SHOWN. Await it in
 * the page's setup. The count comes through useAsyncData, so a prerendered
 * page carries it in its payload.
 */
export async function usePageViewsLabel(path: string) {
  const views = useAsyncData(`page-views-${path}`, () => loadPageViews([path]))
  // Made before the await, so it belongs to the calling component.
  const label = computed(() => {
    const n = views.data.value?.[path]?.views ?? 0
    return n >= MIN_VIEWS_SHOWN ? viewsLabel(n) : ''
  })
  await views
  return label
}
