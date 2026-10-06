<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// One slide per thing jscpd does, the "What jscpd does" section of the
// landing page: a column of chips, and for the chosen one a heading, one or
// two sentences and the terminal. Every
// terminal line below is what jscpd 5.4.0 printed on the demo fixtures of the
// jscpd repository (fixtures/mcp-demo, type2-demo, type3-demo,
// dashboard-demo and the git repository the history-demo README builds), cut to
// what fits one screen, except the semantic and
// compare screens, which copy the output documented in
// fixtures/semantic-demo/README.md and fixtures/compare-demo/README.md
// because both need the 548 MB embedding model; the lines starting with # or
// // are comments added here. Keep this in step with the fixtures' READMEs when the
// output changes. Backticks in a caption render as code.
type Seg = [cls: string, text: string]

interface Slide {
  id: string
  label: string
  title: string
  caption: string
  to: string
  linkLabel: string
  screenTitle: string
  lines: Seg[][]
}

const slides: Slide[] = [
  {
    id: 'exact',
    label: 'Exact',
    title: 'Copies, found by default',
    caption: 'A plain run reports exact copies: the same tokens in two places, whatever the whitespace, layout or comments. Everything from `--min-tokens 50` and `--min-lines 5` up.',
    to: '/concepts/clone-types#type-1-exact-clones',
    linkLabel: 'Type-1 clones',
    screenTitle: 'fixtures/mcp-demo',
    lines: [
      [['p', '$ '], ['cmd', 'jscpd .']],
      [['', 'Clone found (javascript)']],
      [['dim', ' - src/invoice.js [1:1 - 6:72] (6 lines, 105 tokens)']],
      [['dim', '   src/print/invoice.js [1:1 - 6:72]']],
      [['', 'Clone found (javascript)']],
      [['dim', ' - src/invoice.js [6:71 - 12:2] (7 lines, 93 tokens)']],
      [['dim', '   src/print/invoice.js [7:53 - 13:2]']],
      [['', 'Clone found (javascript)']],
      [['dim', ' - src/orders.js [1:1 - 12:2] (12 lines, 124 tokens)']],
      [['dim', '   src/reports/orders.js [1:1 - 12:2]']],
      [['ok', 'Found 3 clones.']]
    ]
  },
  {
    id: 'renamed',
    label: 'Renamed',
    title: 'Renamed clones',
    caption: 'The same code with other variable names or literal values hides from a plain scan. `--ignore-identifiers` and `--ignore-literals` find it and report it as `renamed`; keywords still have to match.',
    to: '/concepts/clone-types#type-2-renamed-clones',
    linkLabel: 'Type-2 clones',
    screenTitle: 'fixtures/type2-demo',
    lines: [
      [['p', '$ '], ['cmd', 'jscpd identifiers']],
      [['dim', 'No duplicates found.']],
      [['', 'Found 0 clones.']],
      [['p', '$ '], ['cmd', 'jscpd identifiers --ignore-identifiers']],
      [['', 'Clone found (javascript, '], ['hi', 'renamed'], ['', ')']],
      [['dim', ' - basket.js [1:1 - 9:2] (9 lines, 57 tokens)']],
      [['dim', '   cart.js [1:1 - 9:2]']],
      [['ok', 'Found 1 clones.']],
      [['p', '$ '], ['cmd', 'jscpd literals --ignore-literals']],
      [['', 'Clone found (javascript, '], ['hi', 'renamed'], ['', ')']],
      [['dim', ' - limits-dev.js [1:1 - 13:3] (13 lines, 51 tokens)']],
      [['dim', '   limits-prod.js [1:1 - 13:3]']],
      [['ok', 'Found 1 clones.']]
    ]
  },
  {
    id: 'similar',
    label: 'Near-miss',
    title: 'Near-miss clones',
    caption: 'A copy with a few lines inserted or changed. `--max-gap-lines` merges the two halves across the gap; `--similarity` compares whole JavaScript and TypeScript functions by syntax tree. Both report `similar` with a score.',
    to: '/concepts/clone-types#type-3-near-miss-clones',
    linkLabel: 'Type-3 clones',
    screenTitle: 'fixtures/type3-demo',
    lines: [
      [['p', '$ '], ['cmd', 'jscpd inserted-line --max-gap-lines 1']],
      [['', 'Clone found (javascript, '], ['warn', 'similar (gap) ~0.91'], ['', ')']],
      [['dim', ' - save-account.js [1:1 - 12:2] (12 lines, 157 tokens)']],
      [['dim', '   save-user.js [1:1 - 11:2]']],
      [['ok', 'Found 1 clones.']],
      [['p', '$ '], ['cmd', 'jscpd similar-functions --similarity 0.7']],
      [['', 'Clone found (javascript, '], ['warn', 'similar (ast) ~0.75'], ['', ')']],
      [['dim', ' - credit-note.js [1:8 - 19:2] (19 lines, 126 tokens)']],
      [['dim', '   invoice.js [1:8 - 17:2]']],
      [['ok', 'Found 1 clones.']]
    ]
  },
  {
    id: 'semantic',
    label: 'Semantic',
    title: 'Semantic clones, even across languages',
    caption: '`--semantic` embeds every function with a code model that runs inside jscpd and pairs the ones that do the same job, like a rule a Rust backend enforces and a Svelte frontend repeats. Experimental, since 5.3.3.',
    to: '/guides/semantic-clones',
    linkLabel: 'Semantic clones',
    screenTitle: 'fixtures/semantic-demo',
    lines: [
      [['p', '$ '], ['cmd', 'jscpd . --semantic']],
      [['dim', 'Semantic clones (experimental): embedding 38 functions']],
      [['dim', '  with nomic-ai/CodeRankEmbed on this machine']],
      [['', 'Clone found (rust, '], ['warn', 'semantic ~0.55'], ['', ')']],
      [['dim', ' - backend/src/feeds.rs [10:1 - 22:2] (13 lines, 58 tokens)']],
      [['dim', '   frontend/src/lib/components/ArticleCard.svelte:typescript [7:3 - 16:4]']],
      [['', 'Clone found (rust, '], ['warn', 'semantic ~0.49'], ['', ')']],
      [['dim', ' - backend/src/pagination.rs [14:1 - 36:2] (23 lines, 172 tokens)']],
      [['dim', '   frontend/src/lib/components/Pager.svelte:typescript [12:3 - 30:4]']],
      [['dim', '... six more pairs ...']],
      [['ok', 'Found 8 clones.']]
    ]
  },
  {
    id: 'ai',
    label: 'AI reporter',
    title: 'A report an LLM can afford to read',
    caption: '`--reporters ai` prints the same findings with shared path prefixes factored out and no code fragments: about 2,800 tokens instead of 23,000 on the benchmark corpus. Pipe it into an agent loop.',
    to: '/project/benchmarks/ai-token-efficiency',
    linkLabel: 'Token benchmark',
    screenTitle: 'fixtures/mcp-demo',
    lines: [
      [['p', '$ '], ['cmd', 'jscpd . --ignore-identifiers --ignore-literals \\']],
      [['cmd', '    --max-gap-lines 1 --reporters ai']],
      [['', 'Clones:']],
      [['', 'src/ invoice.js:1-12 ~ print/invoice.js:1-13 '], ['warn', '[~0.95 gap]']],
      [['', 'src/ orders.js:1-12 ~ reports/orders.js:1-12']],
      [['', 'src/ returns.js:1-10 ~ shipping.js:1-10 '], ['hi', '(renamed)']],
      [['dim', '---']],
      [['ok', '3 clones · 17.7% duplication']]
    ]
  },
  {
    id: 'mcp',
    label: 'MCP & skills',
    title: 'Agents check before they paste',
    caption: '`--mcp` serves the detector to Claude, Cursor or Copilot over stdio, so the agent asks whether code already exists before writing it again. `npx skills add kucherenko/jscpd` installs five skills that teach the whole refactoring loop.',
    to: '/guides/agents',
    linkLabel: 'MCP server and skills',
    screenTitle: 'MCP client',
    lines: [
      [['cmt', '// mcp.json of the client']],
      [['', '{ "mcpServers": { "jscpd": { "command": "jscpd", "args": ["--mcp", "."] } } }']],
      [['', '']],
      [['p', '$ '], ['cmd', 'jscpd --mcp .']],
      [['cmt', '# MCP server over stdio. Tools: check_duplication (a snippet against']],
      [['cmt', '#   the scanned project), get_statistics, check_current_directory, ...']],
      [['', '']],
      [['p', '$ '], ['cmd', 'npx skills add kucherenko/jscpd']],
      [['cmt', '# five skills: jscpd, dry-refactoring, codebase-refactoring,']],
      [['cmt', '#   compare-codebases, code-migration']]
    ]
  },
  {
    id: 'deadcode',
    label: 'Dead code',
    title: 'Dead code and complexity',
    caption: '`--dead-code` finds unused files, exports, symbols and imports in JavaScript, TypeScript and Python, each with a confidence. `--complexity` ranks files and folders by complexity without a clone scan.',
    to: '/guides/dead-code',
    linkLabel: 'Dead code guide',
    screenTitle: 'fixtures/dashboard-demo',
    lines: [
      [['p', '$ '], ['cmd', 'jscpd . --dead-code']],
      [['b', 'Unused files (1)']],
      [['', ' - src/legacy/manifest.ts  '], ['warn', 'certain 95%'], ['', '  10 lines']],
      [['b', 'Unused exports (1)']],
      [['', ' - function src/checks.ts:19:17 checkBatch  '], ['warn', 'high 85%'], ['', '  3 lines']],
      [['ok', 'Found 2 dead code findings in 5 files (14.0% of 93 lines).']],
      [['p', '$ '], ['cmd', 'jscpd . --complexity']],
      [['b', 'Complexity (by complexity; 6 files, 3 folders analyzed)']],
      [['dim', '  TOKENS  LINES  SIZE  CX  PATH']],
      [['', '     182     35   757  '], ['hi', '11'], ['', '  src/rates.ts']],
      [['', '     169     21   665   '], ['hi', '6'], ['', '  src/checks.ts']],
      [['', '     109     11   409   '], ['hi', '3'], ['', '  src/labels.ts']]
    ]
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    title: 'Dashboard and health score',
    caption: '`--dashboard` puts everything on one screen under a 0-100 health score with a grade. `--health` prints the score alone, as a badge for the README or a number for CI.',
    to: '/guides/dashboard',
    linkLabel: 'Project dashboard',
    screenTitle: 'fixtures/dashboard-demo',
    lines: [
      [['p', '$ '], ['cmd', 'jscpd . --dashboard']],
      [['b', 'Health  B   74/100  '], ['hi', '█████████████████▊░░░░░░'], ['', '  93 lines of code (XS)']],
      [['', '  duplication   74  '], ['hi', '████████▉░░░'], ['', '  6.5% in typescript (no text)']],
      [['', '  dead code     72  '], ['hi', '████████▋░░░'], ['', '  14.0%']],
      [['', '  complexity    76  '], ['hi', '█████████▏░░'], ['', '  0.0% in complex files']],
      [['dim', '── Project · Duplication · Complexity ──────────── (trimmed)']],
      [['dim', '── Dead code ───────────────────────────────────────────────']],
      [['', '  13.98% unused lines · 2 findings in 5 files']],
      [['dim', '    LINES  CATEGORY       WHERE']],
      [['', '       10  '], ['warn', 'unused-file'], ['', '    src/legacy/manifest.ts']],
      [['', '        3  '], ['warn', 'unused-export'], ['', '  src/checks.ts:19 checkBatch']]
    ]
  },
  {
    id: 'history',
    label: 'History',
    title: 'Is duplication going up or down?',
    caption: '`--history` scans every commit of a range with the same settings and charts the result, with the change between points and how far `--threshold` can be tightened.',
    to: '/guides/history',
    linkLabel: 'Duplication over history',
    screenTitle: 'fixtures/history-demo',
    lines: [
      [['p', '$ '], ['cmd', 'jscpd src --history-since 2026-01-01']],
      [['b', 'History (since 2026-01-01: 4 commits + working tree)']],
      [['', '  duplicated lines, % of all lines: min 0.0%  max 64.5%  now 47.6%']],
      [['dim', '    64.5% ┤'], ['hi', '       ██']],
      [['dim', '          │'], ['hi', '       ██']],
      [['dim', '          │'], ['hi', '    ▇▇ ██ ▇▇ ▇▇']],
      [['dim', '    32.3% ┤'], ['hi', '    ██ ██ ██ ██']],
      [['dim', '          │'], ['hi', '    ██ ██ ██ ██']],
      [['dim', '     0.0% ┤'], ['hi', ' ▁▁ ██ ██ ██ ██']],
      [['dim', '          └────────────────']],
      [['dim', '            1  2  3  4  5']],
      [['', 'Trend: '], ['err', '+47.6 points'], ['', ' since 3ba9acb (2026-08-01)']]
    ]
  },
  {
    id: 'compare',
    label: 'Compare',
    title: 'How far a port has come',
    caption: '`--compare` pairs the functions of two folders with the semantic model and reports which ones have a counterpart on the other side: the progress of a port, or two implementations of one app checked for parity. Experimental, since 5.4.0.',
    to: '/guides/compare',
    linkLabel: 'Comparing two codebases',
    screenTitle: 'fixtures/compare-demo',
    lines: [
      [['p', '$ '], ['cmd', 'jscpd --compare python typescript']],
      [['b', 'Code']],
      [['', ' '], ['hi', '71%'], ['', ' 5 of 7 functions in python have a counterpart in typescript']],
      [['', ' '], ['hi', '80%'], ['', ' 4 of 5 functions in typescript have a counterpart in python']],
      [['dim', '  ... per-file tables ...']],
      [['', 'Paired under other names (1):']],
      [['dim', '  python                        typescript              similarity']],
      [['', '  billing.py:28 tax_for_region  billing.ts:27 salesTax  '], ['ok', '0.87 high']],
      [['', 'Only in python (2):']],
      [['', '  billing.py (1)']],
      [['warn', '    46  due_date                6 lines']],
      [['', '  shipping.py (1)']],
      [['warn', '    18  estimate_delivery_days  8 lines']]
    ]
  }
]

const SLIDE_MS = 8000

const active = ref(0)
const paused = ref(false)
const autoplay = ref(false)

let timer: ReturnType<typeof setInterval> | undefined

function stop() {
  if (timer) clearInterval(timer)
  timer = undefined
}

function start() {
  stop()
  if (!autoplay.value || paused.value) return
  timer = setInterval(() => {
    active.value = (active.value + 1) % slides.length
  }, SLIDE_MS)
}

function go(index: number) {
  active.value = (index + slides.length) % slides.length
  // A click restarts the countdown, so the slide the reader chose stays
  // for the full interval.
  start()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); go(active.value + 1) }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); go(active.value - 1) }
  if (event.key === 'Home') { event.preventDefault(); go(0) }
  if (event.key === 'End') { event.preventDefault(); go(slides.length - 1) }
}

function pause() { paused.value = true }
function resume() { paused.value = false }

function onVisibility() {
  paused.value = document.hidden
}

// `a `--flag` b` becomes text, code, text.
function captionParts(caption: string) {
  return caption
    .split('`')
    .map((text, i) => ({ code: i % 2 === 1, text }))
    .filter(part => part.text)
}

onMounted(() => {
  // No rotation for readers who asked their system for less motion; the tabs
  // still work.
  autoplay.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.addEventListener('visibilitychange', onVisibility)
  start()
})

onBeforeUnmount(() => {
  stop()
  document.removeEventListener('visibilitychange', onVisibility)
})

watch(paused, start)
</script>

<template>
  <div
    class="feature-slides"
    :class="{ paused }"
    :style="{ '--slide-ms': `${SLIDE_MS}ms` }"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <div
      class="slide-tabs"
      role="tablist"
      aria-label="What jscpd does"
      aria-orientation="vertical"
      @keydown="onKeydown"
    >
      <button
        v-for="(slide, i) in slides"
        :id="`hero-tab-${slide.id}`"
        :key="slide.id"
        type="button"
        role="tab"
        class="slide-tab"
        :aria-selected="i === active"
        :aria-controls="`hero-slide-${slide.id}`"
        :tabindex="i === active ? 0 : -1"
        @click="go(i)"
      >
        {{ slide.label }}
        <span
          v-if="i === active && autoplay"
          :key="`bar-${active}`"
          class="bar"
          aria-hidden="true"
        />
      </button>
    </div>

    <div class="slide-stage">
      <div
        v-for="(slide, i) in slides"
        v-show="i === active"
        :id="`hero-slide-${slide.id}`"
        :key="slide.id"
        role="tabpanel"
        :aria-labelledby="`hero-tab-${slide.id}`"
        class="slide"
      >
        <div class="slide-head">
          <p class="slide-title">{{ slide.title }}</p>
          <p class="slide-caption">
            <template v-for="(part, pi) in captionParts(slide.caption)" :key="pi">
              <code v-if="part.code">{{ part.text }}</code>
              <template v-else>{{ part.text }}</template>
            </template>
            <NuxtLink :to="slide.to" class="slide-link">{{ slide.linkLabel }} →</NuxtLink>
          </p>
        </div>

        <TerminalFrame :title="slide.screenTitle">
          <div class="screen">
            <div v-for="(line, li) in slide.lines" :key="li" class="line">
              <span v-for="(seg, si) in line" :key="si" :class="seg[0]">{{ seg[1] }}</span>
            </div>
          </div>
        </TerminalFrame>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The chips are a column on the left, the slide (its heading, caption and
   terminal) on the right; on a phone the chips wrap into a row above it. */
.feature-slides {
  display: grid;
  grid-template-columns: 10rem minmax(0, 1fr);
  gap: 1rem 2rem;
  align-items: start;
  width: 100%;
  max-width: 68rem;
  margin-inline: auto;
}

.slide-tabs {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.slide-tab {
  position: relative;
  overflow: hidden;
  padding: 0.45rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ui-text-muted, #64748b);
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.slide-tab:hover {
  color: var(--ui-text-highlighted, inherit);
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.06);
}

.slide-tab:focus-visible {
  outline: 2px solid var(--jscpd-blue, #007bff);
  outline-offset: 2px;
}

.slide-tab[aria-selected="true"] {
  color: var(--jscpd-blue, #007bff);
  border-color: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.25);
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.1);
  font-weight: 600;
}

.bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  background: var(--jscpd-blue, #007bff);
  transform-origin: left;
  animation: slide-progress var(--slide-ms, 8000ms) linear forwards;
}

.paused .bar {
  animation-play-state: paused;
}

@keyframes slide-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* A fixed stage keeps the hero's height the same on every slide, so the
   text column does not move while the slides rotate. */
.slide-stage {
  min-height: 25rem;
  min-width: 0;
}

.slide-head {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-height: 5.5rem;
  margin: 0 0 0.875rem;
}

.slide-title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ui-text-highlighted, inherit);
}

.slide-caption {
  margin: 0;
  max-width: 70ch;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ui-text-muted, #64748b);
}

.slide-caption code {
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.8em;
  padding: 0.05em 0.3em;
  border-radius: 0.25rem;
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.08);
  color: var(--ui-text-highlighted, inherit);
  /* A flag must not break at its own hyphens. */
  white-space: nowrap;
}

.slide-link {
  margin-left: 0.3em;
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
  white-space: nowrap;
}

.slide-link:hover {
  text-decoration: underline;
}

.screen {
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  overflow-x: auto;
  color: var(--ui-text, #e2e8f0);
}

.line {
  white-space: pre;
  min-height: 1.5em;
}

.p { color: #22c55e; font-weight: 600; }
.cmd { font-weight: 600; }
.cmt { color: var(--ui-text-muted, #94a3b8); font-style: italic; }
.ok { color: #16a34a; }
.err { color: #ef4444; font-weight: 600; }
.warn { color: #d97706; }
.hi { color: var(--jscpd-blue, #007bff); }
.dim { color: var(--ui-text-muted, #94a3b8); }
.b { font-weight: 600; }

@media (max-width: 639px) {
  .feature-slides {
    grid-template-columns: minmax(0, 1fr);
  }

  .slide-tabs {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .slide-tab {
    border-radius: 999px;
    border-color: var(--ui-border, rgba(100, 116, 139, 0.25));
  }

  .slide-stage {
    min-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    animation: none;
  }
}
</style>

<style>
/* Dark-mode colors for the slide output. Unscoped on purpose: inside a
   scoped block `html.dark .x` compiles to `.dark` alone. */
html.dark .feature-slides .ok { color: #4ade80; }
html.dark .feature-slides .warn { color: #fbbf24; }
html.dark .feature-slides .err { color: #f87171; }
</style>
