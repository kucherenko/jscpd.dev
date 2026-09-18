import history from '~/data/trending-history.json'

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

export interface CloneFile { name: string, start: number, end: number }

export interface RepoClone {
  format: string
  lines: number
  tokens: number
  firstFile: CloneFile
  secondFile: CloneFile
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
  topClones: RepoClone[]
  // Absent in snapshots taken before 2026-09-18, and null on a day whose
  // --dashboard run timed out or failed — the duplication fields above are
  // still the source of truth and never depend on these.
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
  // Present only when at least one repo that day had a health score.
  avgHealth?: number
  healthiest?: HealthBrief | null
  leastHealthy?: HealthBrief | null
}

export interface DaySnapshot {
  date: string
  generatedAt: string
  source: string
  summary: DaySummary & { languages: LanguageStat[] }
  repos: RepoAnalysis[]
}

export interface HistoryDay extends DaySummary {
  date: string
  generatedAt: string
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
  healthScore?: number | null
  healthGrade?: string | null
}

export interface RepoRecord {
  name: string
  url: string
  appearances: RepoAppearance[]
  latest: RepoAnalysis & { date: string, generatedAt: string }
}

// One lazy chunk per file: a page only ever loads the day or repo it shows.
const dayModules = import.meta.glob<DaySnapshot>('../data/trending/*.json', { import: 'default' })
const repoModules = import.meta.glob<RepoRecord>('../data/trending/repos/**/*.json', { import: 'default' })

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

export interface TrendingHistory { updatedAt: string, days: HistoryDay[] }

export const trendingHistory: TrendingHistory = history
export const trendingDates: string[] = trendingHistory.days.map(d => d.date)
export const latestTrendingDate: string = trendingDates[trendingDates.length - 1]!

export const hasTrendingDay = (date: string) => Object.hasOwn(days, date)
export const loadTrendingDay = (date: string) => days[date]!()

export const hasTrendingRepo = (name: string) => Object.hasOwn(repos, name)
export const loadTrendingRepo = (name: string) => repos[name]!()
