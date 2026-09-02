// Update BENCHMARK_DATE when refreshing benchmark data from upstream.
// The date reflects when the benchmark was last run, not when this file was edited.
// Source: https://github.com/kucherenko/jscpd/blob/master/benchmark/BENCHMARK.md

export const BENCHMARK_DATE = 'June 2025'
export const BENCHMARK_HARDWARE = 'Apple Silicon (Darwin arm64)'
export const BENCHMARK_TARGET = 'fixtures/ (547 files, 21,645 lines across 150+ formats)'
export const BENCHMARK_METHODOLOGY =
  'Each tool was run with its default detection threshold (~5 lines / ~50 tokens) and no custom language configurations. Timing uses external wall-clock measurement (date +%s%N), reported in milliseconds. Tools that require per-language invocation (PMD CPD) were run for all 34 supported languages and results summed.'

export interface SpeedEntry {
  tool: string
  slug: string
  timeMs: number
  files: number
  clones: number
  dupLines: number
  speedupVsJscpd5: string
  filesDelta: string
  clonesDelta: string
  dupLinesDelta: string
  color: string
  note?: string
}

export interface FormatSupportEntry {
  tool: string
  slug: string
  color: string
  languages: string
  vue: string
  svelte: string
  astro: string
  md: string
  crossFormat: string
}

export interface CrossFormatEntry {
  tool: string
  slug: string
  color: string
  withinFormat: {
    svelte: string
    astro: string
    vue: string
    markdown: string
    total: string
  }
  crossFormat: {
    clones: number
    lines: number
    detail: string
  }
  embeddedCode: string
  embeddedLangs?: string[]
}

export interface TokenEntry {
  tool: string
  slug: string
  format: string
  outputSize: string
  estTokens: number
  clones: number
  tokensPerClone: number
  llmReady: 'yes' | 'partial' | 'no'
  color: string
  caveat?: string
}

export const speedData: SpeedEntry[] = [
  {
    tool: 'jscpd@5',
    slug: 'jscpd-5',
    timeMs: 84,
    files: 347,
    clones: 212,
    dupLines: 9133,
    speedupVsJscpd5: '1.0×',
    filesDelta: 'baseline',
    clonesDelta: 'baseline',
    dupLinesDelta: 'baseline',
    color: '#10b981',
  },
  {
    tool: 'jscpd-rs',
    slug: 'jscpd-rs',
    timeMs: 111,
    files: 360,
    clones: 222,
    dupLines: 10317,
    speedupVsJscpd5: '1.3× slower',
    filesDelta: '+3.7%',
    clonesDelta: '+4.7%',
    dupLinesDelta: '+13.0%',
    color: '#06b6d4',
  },
  {
    tool: 'Duplo',
    slug: 'duplo',
    timeMs: 162,
    files: 319,
    clones: 518,
    dupLines: 13049,
    speedupVsJscpd5: '1.9× slower',
    filesDelta: '−8.1%',
    clonesDelta: '+144%',
    dupLinesDelta: '+42.9%',
    color: '#f59e0b',
    note: 'Text-based; many false positives',
  },
  {
    tool: 'Fallow dupes',
    slug: 'fallow',
    timeMs: 164,
    files: 34,
    clones: 10,
    dupLines: 3137,
    speedupVsJscpd5: '2.0× slower',
    filesDelta: '−90.2%',
    clonesDelta: '−95.3%',
    dupLinesDelta: '−65.7%',
    color: '#ef4444',
    note: 'Only processes JS/TS files (34 of 547)',
  },
  {
    tool: 'Simian',
    slug: 'simian',
    timeMs: 964,
    files: 547,
    clones: 424,
    dupLines: 15351,
    speedupVsJscpd5: '11.5× slower',
    filesDelta: '+57.6%',
    clonesDelta: '+100%',
    dupLinesDelta: '+68.1%',
    color: '#a855f7',
    note: 'Reports aggregate blocks, not per-language',
  },
  {
    tool: 'PMD CPD',
    slug: 'pmd-cpd',
    timeMs: 35980,
    files: 71,
    clones: 56,
    dupLines: 2267,
    speedupVsJscpd5: '428× slower',
    filesDelta: '−79.5%',
    clonesDelta: '−73.6%',
    dupLinesDelta: '−75.2%',
    color: '#64748b',
    note: 'Only 34 languages supported; 71 of 547 files processable',
  },
]

export const formatSupportData: FormatSupportEntry[] = [
  {
    tool: 'jscpd@5',
    slug: 'jscpd-5',
    color: '#10b981',
    languages: '223',
    vue: 'Section-aware',
    svelte: 'Section-aware',
    astro: 'Section-aware',
    md: 'Section-aware',
    crossFormat: 'Yes',
  },
  {
    tool: 'jscpd-rs',
    slug: 'jscpd-rs',
    color: '#06b6d4',
    languages: '223',
    vue: 'Section-aware',
    svelte: 'Section-aware',
    astro: 'Section-aware',
    md: 'Section-aware',
    crossFormat: 'Yes',
  },
  {
    tool: 'Duplo',
    slug: 'duplo',
    color: '#f59e0b',
    languages: '~7',
    vue: '—',
    svelte: '—',
    astro: '—',
    md: '—',
    crossFormat: 'Text-only',
  },
  {
    tool: 'Simian',
    slug: 'simian',
    color: '#a855f7',
    languages: '∞ (any text)',
    vue: 'Flat text',
    svelte: 'Flat text',
    astro: 'Flat text',
    md: 'Flat text',
    crossFormat: 'Text-only',
  },
  {
    tool: 'PMD CPD',
    slug: 'pmd-cpd',
    color: '#64748b',
    languages: '36',
    vue: '—',
    svelte: '—',
    astro: '—',
    md: '—',
    crossFormat: 'No',
  },
  {
    tool: 'Fallow',
    slug: 'fallow',
    color: '#ef4444',
    languages: 'JS/TS only',
    vue: 'JS blocks only',
    svelte: '—',
    astro: '—',
    md: '—',
    crossFormat: 'No',
  },
]

export const crossFormatData: CrossFormatEntry[] = [
  {
    tool: 'jscpd@5',
    slug: 'jscpd-5',
    color: '#10b981',
    withinFormat: {
      svelte: '3 (410 lines)',
      astro: '3 (124 lines)',
      vue: '6 (274 lines)',
      markdown: '7 (356 lines)',
      total: '19 (1,164 lines)',
    },
    crossFormat: {
      clones: 2,
      lines: 53,
      detail: 'CSS (46 lines) + markup (7 lines)',
    },
    embeddedCode: 'TypeScript, Python, YAML, Markdown',
    embeddedLangs: ['TypeScript', 'Python', 'YAML', 'Markdown'],
  },
  {
    tool: 'jscpd-rs',
    slug: 'jscpd-rs',
    color: '#06b6d4',
    withinFormat: {
      svelte: '3 (410 lines)',
      astro: '5 (177 lines)',
      vue: '6 (274 lines)',
      markdown: '8 (350 lines)',
      total: '22 (1,211 lines)',
    },
    crossFormat: {
      clones: 4,
      lines: 235,
      detail: 'CSS (46 lines) + markup (7, 46, 136 lines)',
    },
    embeddedCode: 'TypeScript, Python, YAML, Markdown, Coffeescript',
    embeddedLangs: ['TypeScript', 'Python', 'YAML', 'Markdown', 'Coffeescript'],
  },
  {
    tool: 'Duplo',
    slug: 'duplo',
    color: '#f59e0b',
    withinFormat: {
      svelte: '1 (165 lines)',
      astro: '1 (112 lines)',
      vue: '3 (219 lines)',
      markdown: '5 (195 lines)',
      total: '10 (691 lines)',
    },
    crossFormat: {
      clones: 8,
      lines: 92,
      detail: 'Text matches: CSS (6, 5, 30, 5 lines) × 4 pairs',
    },
    embeddedCode: 'Flat text only — matches prose, not embedded code',
  },
  {
    tool: 'Simian',
    slug: 'simian',
    color: '#a855f7',
    withinFormat: {
      svelte: '1 (231 lines)',
      astro: '1 (162 lines)',
      vue: '4 (148 lines)',
      markdown: '4 (219 lines)',
      total: '10 (760 lines)',
    },
    crossFormat: {
      clones: 0,
      lines: 0,
      detail: 'Reports as aggregate blocks, not per-language',
    },
    embeddedCode: 'Flat text only — reports as aggregate blocks',
  },
  {
    tool: 'PMD CPD',
    slug: 'pmd-cpd',
    color: '#64748b',
    withinFormat: {
      svelte: '0',
      astro: '0',
      vue: '2 (29 lines)',
      markdown: '0',
      total: '2 (29 lines)',
    },
    crossFormat: {
      clones: 0,
      lines: 0,
      detail: 'Cannot detect cross-format duplicates',
    },
    embeddedCode: 'No cross-format or embedded-code detection',
  },
  {
    tool: 'Fallow dupes',
    slug: 'fallow',
    color: '#ef4444',
    withinFormat: {
      svelte: '1 (58 lines)',
      astro: '0',
      vue: '2 (167 lines)',
      markdown: '0',
      total: '3 (225 lines)',
    },
    crossFormat: {
      clones: 0,
      lines: 0,
      detail: 'Only processes JS/TS files',
    },
    embeddedCode: 'Only processes JS/TS files',
  },
]

export const tokenData: TokenEntry[] = [
  {
    tool: 'jscpd@5',
    slug: 'jscpd-5-ai',
    format: 'AI reporter',
    outputSize: '11 KB',
    estTokens: 2800,
    clones: 212,
    tokensPerClone: 13,
    llmReady: 'yes',
    color: '#10b981',
  },
  {
    tool: 'jscpd-rs',
    slug: 'jscpd-rs-ai',
    format: 'AI reporter',
    outputSize: '12 KB',
    estTokens: 3000,
    clones: 222,
    tokensPerClone: 13,
    llmReady: 'yes',
    color: '#06b6d4',
  },
  {
    tool: 'Fallow',
    slug: 'fallow',
    format: 'Plain text',
    outputSize: '1.6 KB',
    estTokens: 400,
    clones: 10,
    tokensPerClone: 40,
    llmReady: 'partial',
    color: '#ef4444',
    caveat: 'Only processes JS/TS; low token count reflects limited coverage',
  },
  {
    tool: 'Simian',
    slug: 'simian',
    format: 'Plain text',
    outputSize: '60 KB',
    estTokens: 15000,
    clones: 424,
    tokensPerClone: 35,
    llmReady: 'partial',
    color: '#a855f7',
    caveat: 'No structured metadata; aggregates multi-format files',
  },
  {
    tool: 'Duplo',
    slug: 'duplo',
    format: 'JSON',
    outputSize: '754 KB',
    estTokens: 158000,
    clones: 518,
    tokensPerClone: 305,
    llmReady: 'no',
    color: '#f59e0b',
    caveat: 'Large JSON output; includes false positives from text-matching',
  },
  {
    tool: 'PMD CPD',
    slug: 'pmd-cpd',
    format: 'Plain text (34 files)',
    outputSize: '83 KB',
    estTokens: 21000,
    clones: 56,
    tokensPerClone: 375,
    llmReady: 'no',
    color: '#64748b',
    caveat: 'Output spread across 34 separate files; only 56 clones found',
  },
]