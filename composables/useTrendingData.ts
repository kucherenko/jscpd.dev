import history from '~/data/trending-history.json'
import baselines from '~/data/trending-baselines.json'

export interface RepoTotal {
  sources: number
  lines: number
  tokens: number
  clones: number
  duplicatedLines: number
  duplicatedTokens: number
  percentage: number
  percentageTokens: number
}

export interface RepoFormat {
  format: string
  sources: number
  lines: number
  clones: number
  duplicatedLines: number
  percentage: number
}

export interface CloneLocation { name: string, start: number, end: number }

export interface Excerpt { lines: string[], total: number }

export type FileKind = 'code' | 'tests' | 'generated' | 'vendored' | 'translations' | 'docs' | 'data' | 'styles' | 'markup'

/**
 * One duplicated fragment and every place it was copied to. Days measured
 * before 2026-10-07 stored the ten largest clone pairs, so their copy counts
 * are lower bounds and they carry no excerpts.
 */
export interface Finding {
  format: string
  lines: number
  tokens: number
  copies: number
  first: CloneLocation
  others: CloneLocation[]
  kind: FileKind
  excerpt?: Excerpt
  // Present only when the second copy reads differently from the first.
  excerptSecond?: Excerpt
}

export interface GeneratedSummary { files: number, minified: number, sample: string[] }

/** The code-only scan: own source code, no tests, docs, data, vendored or generated files. */
export interface CodeScan extends RepoTotal {
  formats: RepoFormat[]
  topClones: Finding[]
  generated: GeneratedSummary
}

export interface HealthDimension {
  id: string
  source: string
  value: number
  adjusted: number
  lines: number
  halfLife: number
  weight: number
  score: number
  formats?: string[]
  excluded?: string[]
}

export interface HealthSkipped { id: string, reason: string }

export interface RepoHealth {
  score: number | null
  grade: string | null
  size: { lines: number, files: number, class: string }
  dimensions: HealthDimension[]
  skipped?: HealthSkipped[]
}

export interface ComplexityFile { path: string, complexity: number, lines: number, bytes: number }

export interface RepoComplexity {
  total: number
  mean: number
  files: ComplexityFile[]
}

export interface DeadCodeCategory { category: string, count: number }

export interface DeadCodeFinding { category: string, path: string, name: string, line: number, lines: number }

export interface RepoDeadCode {
  percentage: number
  findings: number
  files: number
  byCategory: DeadCodeCategory[]
  largest: DeadCodeFinding[]
}

export interface RepoAnalysis {
  name: string
  url: string
  description: string
  language: string | null
  stars: number
  starsToday: number | null
  defaultBranch: string
  headSha: string
  durationMs: number
  total: RepoTotal
  formats: RepoFormat[]
  topClones: Finding[]
  // Absent in snapshots taken before 2026-10-07 and null when the code scan
  // failed. The raw numbers above never depend on it.
  code?: CodeScan | null
  // Set when a past day was re-measured (scripts/backfill-trending.mjs).
  measuredAt?: string
  jscpdVersion?: string
  // Dashboard data feeds the health calibration corpus; the pages do not
  // show it for third-party repositories. Absent before 2026-09-18, null on
  // a day whose --dashboard run timed out or failed.
  health?: RepoHealth | null
  complexity?: RepoComplexity | null
  deadCode?: RepoDeadCode | null
}

export interface RepoBrief { name: string, clones: number, percentage: number }

export interface HealthBrief { name: string, score: number, grade: string }

export interface LanguageStat {
  language: string
  repos: number
  clones: number
  lines: number
  duplicatedLines: number
  percentage: number
}

export interface DaySummary {
  repos: number
  sources: number
  lines: number
  tokens: number
  clones: number
  duplicatedLines: number
  duplicatedTokens: number
  percentage: number
  percentageTokens: number
  avgPercentage: number
  medianPercentage: number
  mostDuplicated: RepoBrief | null
  cleanest: RepoBrief | null
  mostClones: RepoBrief | null
  // Present only when at least one repo that day has a code scan wide
  // enough to quote (minCodeFiles in the baselines file).
  codeRepos?: number
  codeSources?: number
  codeLines?: number
  codeClones?: number
  codeDuplicatedLines?: number
  codePercentage?: number
  codeMedianPercentage?: number
  codeMostDuplicated?: RepoBrief | null
  codeCleanest?: RepoBrief | null
  generatedFiles?: number
  // Present only when at least one repo that day had a health score.
  avgHealth?: number
  healthiest?: HealthBrief | null
  leastHealthy?: HealthBrief | null
}

export interface DaySnapshot {
  date: string
  generatedAt: string
  source: string
  jscpdVersion?: string | null
  summary: DaySummary & { languages: LanguageStat[] }
  repos: RepoAnalysis[]
}

export interface HistoryDay extends DaySummary {
  date: string
  week: string
  generatedAt: string
}

export interface WeekIndex {
  week: string
  from: string
  to: string
  days: number
  repos: number
  codeRepos: number
}

export interface RepoAppearance {
  date: string
  rank: number
  stars: number
  starsToday: number | null
  headSha: string
  sources: number
  lines: number
  clones: number
  duplicatedLines: number
  percentage: number
  // null before the code scan existed, or when it covered too few files
  codePercentage: number | null
  codeSources: number | null
  healthScore?: number | null
  healthGrade?: string | null
}

export interface RepoRecord {
  name: string
  url: string
  appearances: RepoAppearance[]
  latest: RepoAnalysis & { date: string, generatedAt: string }
}

export interface WeekBrief {
  sources: number
  lines: number
  clones: number
  duplicatedLines: number
  percentage: number
}

export interface WeekRepo {
  name: string
  url: string
  description: string
  language: string | null
  stars: number
  starsToday: number | null
  days: number
  rank: number
  date: string
  total: WeekBrief
  code: (WeekBrief & { generated: number }) | null
  topFinding: {
    format: string
    lines: number
    copies: number
    kind: FileKind
    first: CloneLocation
    scope: 'code' | 'all'
  } | null
}

export interface WeekSnapshot {
  week: string
  from: string
  to: string
  days: string[]
  summary: DaySummary & { languages: LanguageStat[] }
  repos: WeekRepo[]
}

export interface BaselineRow {
  language: string
  repos: number
  p25: number
  median: number
  p75: number
  values: number[]
}

export interface Baselines {
  updatedAt: string
  from: string | null
  to: string | null
  minRepos: number
  minCodeFiles: number
  repos: number
  all: BaselineRow | null
  languages: BaselineRow[]
  pending: Array<{ language: string, repos: number }>
  method: { format: string[], ignore: string[] }
}

// One lazy chunk per file: a page only ever loads the day, week or repo it shows.
const dayModules = import.meta.glob<DaySnapshot>('../data/trending/*.json', { import: 'default' })
const repoModules = import.meta.glob<RepoRecord>('../data/trending/repos/**/*.json', { import: 'default' })
const weekModules = import.meta.glob<WeekSnapshot>('../data/trending/weeks/*.json', { import: 'default' })

const byBasename = <T>(modules: Record<string, () => Promise<T>>, prefix: string) => {
  const map: Record<string, () => Promise<T>> = {}
  for (const [path, load] of Object.entries(modules)) {
    const i = path.indexOf(prefix)
    if (i !== -1) map[path.slice(i + prefix.length).replace(/\.json$/, '')] = load
  }
  return map
}

const days = byBasename(dayModules, '/data/trending/')
const repos = byBasename(repoModules, '/data/trending/repos/')
const weeks = byBasename(weekModules, '/data/trending/weeks/')

export interface TrendingHistory { updatedAt: string, days: HistoryDay[], weeks: WeekIndex[] }

export const trendingHistory: TrendingHistory = history
export const trendingDates: string[] = trendingHistory.days.map(d => d.date)
export const latestTrendingDate: string = trendingDates[trendingDates.length - 1]!
export const trendingWeeks: WeekIndex[] = trendingHistory.weeks
export const latestTrendingWeek: string = trendingWeeks[trendingWeeks.length - 1]!.week
export const trendingBaselines: Baselines = baselines as Baselines

export const hasTrendingDay = (date: string) => Object.hasOwn(days, date)
export const loadTrendingDay = (date: string) => days[date]!()

export const hasTrendingRepo = (name: string) => Object.hasOwn(repos, name)
export const loadTrendingRepo = (name: string) => repos[name]!()

export const hasTrendingWeek = (week: string) => Object.hasOwn(weeks, week)
export const loadTrendingWeek = (week: string) => weeks[week]!()

/** The code scan when it is wide enough to quote a percentage for, else null. */
export const codeMetric = (repo: { code?: CodeScan | null }) =>
  repo.code && repo.code.sources >= trendingBaselines.minCodeFiles ? repo.code : null
