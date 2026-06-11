<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const mode = ref<'default' | 'ai'>('default')
const revealedLines = ref<Set<number>>(new Set())
const isTransitioning = ref(false)

const tokenCount = computed(() => mode.value === 'default' ? 5400 : 1100)
const tokenPercent = computed(() => Math.round((tokenCount.value / 5400) * 100))

function switchMode(m: 'default' | 'ai') {
  if (m === mode.value || isTransitioning.value) return
  isTransitioning.value = true
  mode.value = m
  revealedLines.value = new Set()
  nextTick(() => {
    const total = m === 'default' ? 8 : 12
    for (let i = 0; i < total; i++) {
      setTimeout(() => revealedLines.value.add(i), i * 55 + 100)
    }
    setTimeout(() => { isTransitioning.value = false }, 300)
  })
}

// Initial reveal
for (let i = 0; i < 8; i++) {
  setTimeout(() => revealedLines.value.add(i), i * 55 + 400)
}
</script>

<template>
  <div class="reporter-demo">
    <!-- Header with toggle + stats -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
      <!-- Toggle -->
      <div class="relative inline-flex bg-background ring-1 ring-border rounded-xl p-1 shadow-sm">
        <div
          class="absolute top-1 bottom-1 rounded-lg bg-primary/10 transition-all duration-300 ease-out"
          :class="mode === 'ai' ? 'left-[calc(50%+2px)] right-1' : 'left-1 right-[calc(50%+2px)]'"
        />
        <button
          class="relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
          :class="mode === 'default' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'"
          @click="switchMode('default')"
        >
          <span class="i-lucide-terminal w-4 h-4" />
          Verbose
        </button>
        <button
          class="relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
          :class="mode === 'ai' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'"
          @click="switchMode('ai')"
        >
          <span class="i-lucide-wand-2 w-4 h-4" />
          Compact
        </button>
      </div>

      <!-- Token meter -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 text-xs font-mono tabular-nums">
          <span class="i-lucide-coins w-3.5 h-3.5 text-amber-500" />
          <span
            class="transition-all duration-500 font-bold tabular-nums"
            :class="mode === 'ai' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'"
          >{{ tokenCount.toLocaleString() }}</span>
          <span class="text-muted-foreground">tokens</span>
        </div>
        <div class="w-24 h-2 rounded-full bg-muted overflow-hidden ring-1 ring-border/50">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            :class="mode === 'ai' ? 'bg-green-500' : 'bg-amber-500'"
            :style="{ width: tokenPercent + '%' }"
          />
        </div>
        <Transition name="badge" mode="out-in">
          <span
            v-if="mode === 'ai'"
            key="ai"
            class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800"
          >
            <span class="i-lucide-arrow-down w-3 h-3" />79%
          </span>
          <span
            v-else
            key="default"
            class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-muted text-muted-foreground ring-1 ring-border"
          >
            <span class="i-lucide-equals w-3 h-3" />baseline
          </span>
        </Transition>
      </div>
    </div>

    <!-- Terminal -->
    <div
      class="rounded-xl overflow-hidden ring-1 ring-border shadow-lg transition-shadow duration-300"
      :class="isTransitioning ? 'ring-border' : mode === 'ai' ? 'ring-green-500/30 shadow-green-500/5' : 'ring-border'"
    >
      <!-- Title bar -->
      <div class="flex items-center gap-3 px-4 py-2 border-b border-border/60 bg-muted/50">
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full bg-red-400/70" />
          <div class="w-2 h-2 rounded-full bg-amber-400/70" />
          <div class="w-2 h-2 rounded-full bg-green-400/70" />
        </div>
        <div class="flex-1" />
        <code class="text-[11px] text-muted-foreground font-mono">
          {{ mode === 'ai' ? 'jscpd --reporters ai ./src' : 'jscpd ./src' }}
        </code>
        <div class="flex-1" />
      </div>

      <!-- Output -->
      <div class="bg-muted/30 dark:bg-muted/10 p-5 font-mono text-[13px] leading-6 min-h-[280px]">
        <!-- Verbose mode -->
        <div v-if="mode === 'default'" class="space-y-1.5">
          <div v-show="revealedLines.has(0)" class="text-muted-foreground animate-fade-in"># Scan your source code</div>
          <div v-show="revealedLines.has(1)" class="mb-4 animate-fade-in">
            <span class="text-green-500 select-none">$</span><span class="text-primary font-semibold"> jscpd</span><span class="text-muted-foreground"> ./src</span><span class="inline-block w-1.5 h-3.5 bg-primary/50 ml-1 animate-pulse rounded-sm align-text-bottom" />
          </div>

          <div v-show="revealedLines.has(2)" class="text-amber-600 dark:text-amber-400 font-medium animate-fade-in">
            ▶ Clone found <span class="text-blue-500">(typescript)</span>:
          </div>
          <div v-show="revealedLines.has(3)" class="text-muted-foreground mb-3 pl-4 border-l-2 border-border animate-fade-in">
            <div><span class="text-red-400">-</span> src/utils.ts <span class="text-blue-500">[10:1 - 25:3]</span> <span class="opacity-60">(15 lines, 129 tokens)</span></div>
            <div>  src/helpers.ts <span class="text-blue-500">[5:1 - 20:3]</span></div>
          </div>

          <div v-show="revealedLines.has(4)" class="text-amber-600 dark:text-amber-400 font-medium animate-fade-in">
            ▶ Clone found <span class="text-blue-500">(typescript)</span>:
          </div>
          <div v-show="revealedLines.has(5)" class="text-muted-foreground mb-3 pl-4 border-l-2 border-border animate-fade-in">
            <div><span class="text-red-400">-</span> src/utils.ts <span class="text-blue-500">[45:5 - 62:2]</span> <span class="opacity-60">(17 lines, 178 tokens)</span></div>
            <div>  src/components/Button.tsx <span class="text-blue-500">[12:1 - 29:2]</span></div>
          </div>

          <div v-show="revealedLines.has(6)" class="text-muted-foreground mb-3 pl-4 border-l-2 border-border animate-fade-in">
            <span class="opacity-50"># ... 87 more clones</span>
          </div>

          <div v-show="revealedLines.has(7)" class="pt-3 mt-2 border-t border-border/50 animate-fade-in">
            <div class="text-green-600 dark:text-green-400 font-semibold">✓ Found 90 clones.</div>
            <div class="text-muted-foreground">Detection time: <span>13ms</span></div>
          </div>
        </div>

        <!-- AI mode -->
        <div v-else class="space-y-1.5">
          <div v-show="revealedLines.has(0)" class="flex items-center gap-2 mb-1 animate-fade-in">
            <span class="text-muted-foreground"># Compact — pipe into LLMs</span>
          </div>
          <div v-show="revealedLines.has(1)" class="mb-4 animate-fade-in">
            <span class="text-green-500 select-none">$</span><span class="text-primary font-semibold"> jscpd</span><span class="text-orange-500"> --reporters ai</span><span class="text-muted-foreground"> ./src</span><span class="inline-block w-1.5 h-3.5 bg-primary/50 ml-1 animate-pulse rounded-sm align-text-bottom" />
          </div>

          <div v-show="revealedLines.has(2)" class="text-amber-600 dark:text-amber-400 font-medium mb-2 animate-fade-in">▶ Clones:</div>

          <div v-show="revealedLines.has(3)" class="pl-4 border-l-2 border-border animate-fade-in">
            src/utils.ts<span class="text-blue-500"> 10-25</span> <span class="text-muted-foreground">~</span> src/helpers.ts<span class="text-blue-500"> 5-20</span>
          </div>
          <div v-show="revealedLines.has(4)" class="pl-4 border-l-2 border-border animate-fade-in">
            src/utils.ts<span class="text-blue-500"> 45-62</span> <span class="text-muted-foreground">~</span> src/components/Button.tsx<span class="text-blue-500"> 12-29</span>
          </div>
          <div v-show="revealedLines.has(5)" class="pl-4 border-l-2 border-border animate-fade-in">
            src/hooks/useAuth.ts<span class="text-blue-500"> 1-34</span> <span class="text-muted-foreground">~</span> src/hooks/useSession.ts<span class="text-blue-500"> 1-34</span>
          </div>
          <div v-show="revealedLines.has(6)" class="pl-4 border-l-2 border-border animate-fade-in">
            src/services/api.ts<span class="text-blue-500"> 8-45</span> <span class="text-muted-foreground">~</span> src/services/client.ts<span class="text-blue-500"> 12-49</span>
          </div>
          <div v-show="revealedLines.has(7)" class="pl-4 border-l-2 border-border animate-fade-in">
            src/utils/formatter.ts<span class="text-blue-500"> 3-28</span> <span class="text-muted-foreground">~</span> src/utils/parser.ts<span class="text-blue-500"> 7-32</span>
          </div>
          <div v-show="revealedLines.has(8)" class="pl-4 border-l-2 border-border animate-fade-in">
            src/components/Modal.tsx<span class="text-blue-500"> 15-67</span> <span class="text-muted-foreground">~</span> src/components/Dialog.tsx<span class="text-blue-500"> 18-70</span>
          </div>
          <div v-show="revealedLines.has(9)" class="pl-4 border-l-2 border-border animate-fade-in">
            src/pages/Home.vue<span class="text-blue-500"> 22-88</span> <span class="text-muted-foreground">~</span> src/pages/About.vue<span class="text-blue-500"> 25-91</span>
          </div>
          <div v-show="revealedLines.has(10)" class="pl-4 border-l-2 border-border animate-fade-in opacity-50">
            ... 80 more
          </div>

          <div v-show="revealedLines.has(11)" class="pt-3 mt-2 border-t border-border/50 animate-fade-in">
            <div class="text-green-600 dark:text-green-400 font-semibold">90 clones · 54.4% duplication</div>
            <div class="text-muted-foreground">time: <span>11ms</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeSlide 0.25s ease-out both;
}
@keyframes fadeSlide {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.badge-enter-active,
.badge-leave-active { transition: all 0.2s ease; }
.badge-enter-from { opacity: 0; transform: scale(0.85); }
.badge-leave-to { opacity: 0; transform: scale(0.85); }
</style>