// Cloudflare Web Analytics, as scripts/analytics-snapshot.mjs stores it in
// data/analytics: one file per month with every day's page views and visits
// per path, and window.json with the breakdowns of the last 30 days. The
// files are imported lazily, so a page that shows nothing of them loads
// nothing; prerendered pages carry the result in their payload.

/** [views, visits] */
export type PathCount = [number, number]

export interface DayRecord {
  views: number
  visits: number
  paths: Record<string, PathCount>
  /** Cloudflare's sample interval when the day came back sampled: its counts are estimates. */
  sample?: number
}

export interface MonthFile { days: Record<string, DayRecord> }

export interface Counted { views: number, visits: number }
export interface NamedCount extends Counted { name: string }
export interface HostCount extends Counted { host: string }
export interface PathCounted extends Counted { path: string }

export interface WindowFile extends Counted {
  updatedAt: string
  since: string
  until: string
  hosts: HostCount[]
  pages: PathCounted[]
  referrers: HostCount[]
  countries: NamedCount[]
  devices: NamedCount[]
  browsers: NamedCount[]
  os: NamedCount[]
}

export interface DayPoint extends Counted { date: string, sample?: number }

export interface SiteStats {
  /** When the snapshot was taken; null before the first one. */
  updatedAt: string | null
  /** Every day since the beacon started counting, in order. */
  days: DayPoint[]
  /** The last day whose counts are a sampled estimate; null when every day was counted in full. */
  sampledUntil: string | null
  totals: Counted
  /** Every path, all time, most viewed first. */
  paths: PathCounted[]
  window: WindowFile | null
}

// A count under this says more about the age of the blog than about the
// post, so the list and the post page show nothing until a post gets there.
export const MIN_VIEWS_SHOWN = 100

const monthModules = import.meta.glob<MonthFile>('../data/analytics/months/*.json', { import: 'default' })
const windowModules = import.meta.glob<WindowFile>('../data/analytics/window.json', { import: 'default' })

async function loadDays(): Promise<Array<[string, DayRecord]>> {
  const out: Array<[string, DayRecord]> = []
  for (const key of Object.keys(monthModules).sort()) {
    const month = await monthModules[key]!()
    for (const [date, record] of Object.entries(month.days)) out.push([date, record])
  }
  return out.sort(([a], [b]) => a.localeCompare(b))
}

async function loadWindow(): Promise<WindowFile | null> {
  const key = Object.keys(windowModules)[0]
  return key ? windowModules[key]!() : null
}

export async function loadSiteStats(): Promise<SiteStats> {
  const [days, window] = await Promise.all([loadDays(), loadWindow()])
  const totals = { views: 0, visits: 0 }
  const byPath = new Map<string, PathCounted>()
  const points: DayPoint[] = []
  let sampledUntil: string | null = null
  for (const [date, record] of days) {
    points.push({ date, views: record.views, visits: record.visits, ...(record.sample ? { sample: record.sample } : {}) })
    if (record.sample) sampledUntil = date
    totals.views += record.views
    totals.visits += record.visits
    for (const [path, [views, visits]] of Object.entries(record.paths)) {
      const row = byPath.get(path) ?? { path, views: 0, visits: 0 }
      row.views += views
      row.visits += visits
      byPath.set(path, row)
    }
  }
  const paths = [...byPath.values()].sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
  return { updatedAt: window?.updatedAt ?? null, days: points, sampledUntil, totals, paths, window }
}

/** All-time page views of the given paths; a path never visited counts 0. */
export async function loadPathViews(paths: string[]): Promise<Record<string, number>> {
  const wanted = new Set(paths)
  const out: Record<string, number> = Object.fromEntries(paths.map(p => [p, 0]))
  for (const [, record] of await loadDays()) {
    for (const [path, [views]] of Object.entries(record.paths)) {
      if (wanted.has(path)) out[path] = (out[path] ?? 0) + views
    }
  }
  return out
}

export const viewsLabel = (n: number) => `${num(n)} ${n === 1 ? 'view' : 'views'}`
