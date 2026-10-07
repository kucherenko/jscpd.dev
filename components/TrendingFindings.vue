<template>
  <ul class="findings">
    <li v-for="(f, i) in findings.slice(0, limit)" :key="i" class="finding">
      <div class="finding-head">
        <span class="finding-size">
          <strong>{{ f.lines }} lines</strong> in <strong>{{ f.copies }} places</strong>
        </span>
        <span class="chip">{{ f.format }}</span>
        <span v-if="f.kind !== 'code'" class="chip chip-kind">{{ kindLabel[f.kind] }}</span>
        <span class="finding-tokens">{{ num(f.tokens) }} tokens</span>
      </div>

      <div class="finding-files">
        <a :href="blobUrl(repo, f.first)" target="_blank" rel="noopener">{{ cleanName(f.first.name) }}<span class="finding-range">:{{ f.first.start }}–{{ f.first.end }}</span></a>
        <template v-for="o in f.others.slice(0, shownOthers)" :key="`${o.name}:${o.start}`">
          <span class="finding-sep" aria-hidden="true">·</span>
          <a :href="blobUrl(repo, o)" target="_blank" rel="noopener">{{ cleanName(o.name) }}<span class="finding-range">:{{ o.start }}–{{ o.end }}</span></a>
        </template>
        <span v-if="f.copies - 1 > shownOthers" class="finding-more">and {{ f.copies - 1 - shownOthers }} more</span>
      </div>

      <div v-if="f.excerpt" class="finding-code" :class="{ 'finding-code--pair': f.excerptSecond }">
        <pre class="finding-pre"><code><span v-for="(line, li) in f.excerpt.lines" :key="li" class="finding-line"><span class="finding-ln">{{ f.first.start + li }}</span>{{ line }}
</span></code></pre>
        <pre v-if="f.excerptSecond && f.others[0]" class="finding-pre"><code><span v-for="(line, li) in f.excerptSecond.lines" :key="li" class="finding-line"><span class="finding-ln">{{ f.others[0].start + li }}</span>{{ line }}
</span></code></pre>
      </div>
      <p v-if="f.excerpt && f.excerpt.total > f.excerpt.lines.length" class="finding-note">
        First {{ f.excerpt.lines.length }} of {{ f.excerpt.total }} lines<template v-if="f.excerptSecond">, the second copy on the right</template>.
      </p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { Finding } from '~/composables/useTrendingData'

// Locations listed per finding before "and N more".
const shownOthers = 4

withDefaults(defineProps<{
  findings: Finding[]
  repo: { url: string, headSha: string }
  limit?: number
}>(), { limit: 3 })
</script>

<style scoped>
.findings {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.finding {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
  min-width: 0;
}

.finding-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #64748b);
}

.finding-size strong {
  color: var(--ui-text-highlighted, inherit);
  font-weight: 600;
}

.chip-kind {
  color: #d97706;
  border-color: rgba(217, 119, 6, 0.4);
}

.finding-tokens {
  margin-left: auto;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.finding-files {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}

.finding-files a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.finding-files a:hover {
  text-decoration: underline;
}

.finding-range,
.finding-sep,
.finding-more {
  color: var(--ui-text-muted, #64748b);
}

.finding-more {
  font-family: inherit;
}

.finding-code {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}

.finding-code--pair {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
}

.finding-pre {
  margin: 0;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(100, 116, 139, 0.07);
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;
}

.finding-line {
  display: block;
}

.finding-ln {
  display: inline-block;
  width: 3.25em;
  margin-right: 0.75em;
  text-align: right;
  color: var(--ui-text-muted, #64748b);
  opacity: 0.7;
  user-select: none;
  font-variant-numeric: tabular-nums;
}

.finding-note {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}
</style>
