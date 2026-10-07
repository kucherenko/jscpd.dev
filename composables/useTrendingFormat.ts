import type { FileKind } from '~/composables/useTrendingData'

export const num = (n: number | null | undefined) => typeof n === 'number' ? n.toLocaleString('en-US') : '—'

/** 1284 → 1.3K, 5175486 → 5.2M — for stat tiles and axis ticks. */
export const compact = (n: number | null | undefined) =>
  typeof n === 'number' ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : '—'

/** Snapshot dates are UTC calendar days ("2026-09-03"); format them without a timezone shift. */
export const formatDay = (date: string, opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })

export const shortDay = (date: string) => formatDay(date, { month: 'short', day: 'numeric' })

/** The three steps of the duplication colour scale. */
export const dupTone = (pct: number): 'low' | 'mid' | 'high' => pct < 3 ? 'low' : pct < 8 ? 'mid' : 'high'

export const dupClass = (pct: number) => `dup-${dupTone(pct)}`

/** Health grade → CSS class, same A-E scale as the jscpd --health badge. */
export const gradeClass = (grade: string | null | undefined) =>
  grade ? `grade-${grade.toLowerCase()}` : 'grade-na'

// cross-format sources carry a block suffix (file.md:markdown, file.vue:script)
// that is not part of the real path
export const cleanName = (name: string) => name.replace(/:[a-z][\w-]*$/, '')

export const blobUrl = (repo: { url: string, headSha: string }, f: { name: string, start: number, end: number }) =>
  `${repo.url}/blob/${repo.headSha}/${cleanName(f.name)}#L${f.start}-L${f.end}`

export const trendingDayPath = (date: string, latest: string) => date === latest ? '/trending' : `/trending/${date}`
export const trendingRepoPath = (name: string) => `/trending/${name}`
export const trendingWeekPath = (week: string) => `/trending/week/${week}`

/** "2026-W41" → "Week 41, 2026". */
export const weekTitle = (week: string) => {
  const [year, n] = week.split('-W')
  return `Week ${Number(n)}, ${year}`
}

/** "Oct 5 – Oct 11" for a week's Monday and Sunday. */
export const weekRange = (w: { from: string, to: string }) => `${shortDay(w.from)} – ${shortDay(w.to)}`

export const kindLabel: Record<FileKind, string> = {
  code: 'code',
  tests: 'tests',
  generated: 'generated',
  vendored: 'vendored',
  translations: 'translations',
  docs: 'docs and examples',
  data: 'data files',
  styles: 'styles',
  markup: 'markup'
}

/** How a value sits among baseline repos: the share with more and with less duplication. */
export const standing = (values: number[], v: number) => {
  if (!values.length) return null
  const more = values.filter(x => x > v).length
  const less = values.filter(x => x < v).length
  return { more: Math.round(100 * more / values.length), less: Math.round(100 * less / values.length) }
}
