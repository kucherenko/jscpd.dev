<template>
  <div class="copy-command" :class="{ 'copy-command--captioned': caption }">
    <div v-if="caption" class="copy-command-caption">{{ caption }}</div>
    <div class="copy-command-line">
      <span class="copy-command-prompt" aria-hidden="true">$</span>
      <code ref="commandText" class="copy-command-text">{{ cmd }}</code>
      <button
        class="copy-command-btn"
        type="button"
        :aria-label="copied ? 'Copied' : `Copy command: ${cmd}`"
        :title="copied ? 'Copied!' : 'Copy to clipboard'"
        @click="copy"
      >
        <Icon v-if="!copied" name="lucide:copy" class="copy-command-icon" />
        <Icon v-else name="lucide:check" class="copy-command-icon copy-command-icon--done" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  /** The shell command shown and copied, without the leading `$`. */
  cmd: string
  /** Optional one-line caption above the command, e.g. a file name. */
  caption?: string
}>()

const copied = ref(false)
const commandText = ref<HTMLElement | null>(null)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.cmd)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard API unavailable (insecure context / old browser): select the
    // text so the user can copy it with the keyboard.
    const el = commandText.value
    if (el) {
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }
}
</script>

<style scoped>
.copy-command {
  margin: 0.75rem 0;
}

.copy-command-caption {
  margin-bottom: 0.25rem;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--ui-text-dimmed, #64748b);
}

.copy-command-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.8125rem;
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.08);
  border: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.12);
  border-radius: 0.5rem;
}

.copy-command-prompt {
  color: #22c55e;
  flex-shrink: 0;
  user-select: none;
}

.copy-command-text {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  white-space: nowrap;
  color: var(--ui-text, #e2e8f0);
  background: none;
  padding: 0;
  border: 0;
  scrollbar-width: none;
}

.copy-command-text::-webkit-scrollbar {
  display: none;
}

.copy-command-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  padding: 0;
  border-radius: 0.375rem;
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.1);
  border: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.15);
  color: var(--ui-text-muted, #94a3b8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-command-btn:hover {
  color: var(--ui-text, #e2e8f0);
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.2);
  border-color: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.35);
}

.copy-command-btn:focus-visible {
  outline: 2px solid var(--jscpd-blue, #007bff);
  outline-offset: 2px;
}

.copy-command-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.copy-command-icon--done {
  color: #22c55e;
}
</style>
