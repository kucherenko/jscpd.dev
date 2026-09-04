export const num = (n: number | null | undefined) => typeof n === 'number' ? n.toLocaleString('en-US') : '—'

/** 1284 → 1.3K, 5175486 → 5.2M — for stat tiles and axis ticks. */
export const compact = (n: number | null | undefined) =>
  typeof n === 'number' ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : '—'

/** Snapshot dates are UTC calendar days ("2026-09-03"); format them without a timezone shift. */
export const formatDay = (date: string, opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })

export const shortDay = (date: string) => formatDay(date, { month: 'short', day: 'numeric' })

export const dupClass = (pct: number) => pct < 3 ? 'dup-low' : pct < 8 ? 'dup-mid' : 'dup-high'

// cross-format sources carry a block suffix (file.md:markdown, file.vue:script)
// that is not part of the real path
export const cleanName = (name: string) => name.replace(/:[a-z][\w-]*$/, '')

export const blobUrl = (repo: { url: string, headSha: string }, f: { name: string, start: number, end: number }) =>
  `${repo.url}/blob/${repo.headSha}/${cleanName(f.name)}#L${f.start}-L${f.end}`

export const trendingDayPath = (date: string, latest: string) => date === latest ? '/trending' : `/trending/${date}`
export const trendingRepoPath = (name: string) => `/trending/${name}`
