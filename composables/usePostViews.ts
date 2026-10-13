// Page views of the blog posts from Cloudflare Web Analytics, as
// scripts/analytics-snapshot.mjs stores them in data/analytics/months: one
// file per month, each day's views and visits per /blog/ path. The files are
// imported lazily and the prerendered pages carry the sums in their payload.

/** [views, visits] */
export type PostCount = [number, number]

export interface DayRecord { posts: Record<string, PostCount> }

export interface MonthFile { days: Record<string, DayRecord> }

export interface PostViews { views: number, visits: number }

// Raise it to keep small counts off the pages.
export const MIN_VIEWS_SHOWN = 1

const monthModules = import.meta.glob<MonthFile>('../data/analytics/months/*.json', { import: 'default' })

/** All-time views and visits of the given post paths; a path never visited counts 0. */
export async function loadPostViews(paths: string[]): Promise<Record<string, PostViews>> {
  const out: Record<string, PostViews> = Object.fromEntries(paths.map(p => [p, { views: 0, visits: 0 }]))
  for (const key of Object.keys(monthModules).sort()) {
    const month = await monthModules[key]!()
    for (const record of Object.values(month.days)) {
      for (const [path, [views, visits]] of Object.entries(record.posts)) {
        const row = out[path]
        if (!row) continue
        row.views += views
        row.visits += visits
      }
    }
  }
  return out
}

export const viewsLabel = (n: number) => `${num(n)} ${n === 1 ? 'view' : 'views'}`
