<template>
  <div class="hero-terminal-wrapper">
    <div class="hero-terminal">
      <div class="terminal-header">
        <div class="terminal-header-left">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
          <span class="terminal-title">Terminal</span>
        </div>
        <div class="install-section">
          <div class="install-tabs">
            <button
              :class="['install-tab', { active: activeTab === 'curl' }]"
              @click="activeTab = 'curl'"
            >
              <Icon name="lucide:terminal" class="tab-icon" />
              curl
            </button>
            <button
              :class="['install-tab', { active: activeTab === 'npm' }]"
              @click="activeTab = 'npm'"
            >
              <Icon name="simple-icons:npm" class="tab-icon" />
              npm
            </button>
            <button
              :class="['install-tab', { active: activeTab === 'cargo' }]"
              @click="activeTab = 'cargo'"
            >
              <Icon name="simple-icons:rust" class="tab-icon" />
              cargo
            </button>
            <button
              :class="['install-tab', { active: activeTab === 'brew' }]"
              @click="activeTab = 'brew'"
            >
              <Icon name="simple-icons:homebrew" class="tab-icon" />
              brew
            </button>
            <button
              :class="['install-tab', { active: activeTab === 'nix' }]"
              @click="activeTab = 'nix'"
            >
              <Icon name="simple-icons:nixos" class="tab-icon" />
              nix
            </button>
          </div>
        </div>
      </div>
      <div class="terminal-body">
        <div class="command-line">
          <span class="prompt">$</span>
          <code ref="commandText">{{ activeCommand }}</code>
          <button class="copy-btn" @click="copyCommand" :title="copied ? 'Copied!' : 'Copy to clipboard'">
            <Icon v-if="!copied" name="lucide:copy" class="copy-icon" />
            <Icon v-else name="lucide:check" class="copy-icon copied" />
          </button>
        </div>
        <div class="terminal-divider"></div>
        <div class="terminal-output">
          <div class="text-muted mb-2 typing-text">// Your code deserves better than copy/paste chaos</div>
          <div class="output-line mb-2">
            <span class="text-green-400">$</span>
            <span class="text-blue-400">jscpd</span>
            <span class="text-muted">./src</span>
            <span class="typing-cursor"></span>
          </div>
          <div class="text-muted" style="animation: fadeIn 0.5s ease 1s both;">→ Finding duplicates...</div>
          <div class="text-green-400 mt-2" style="animation: fadeIn 0.5s ease 2s both;">✓ Scan complete: 3 clones found</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const commands: Record<string, string> = {
  curl: 'curl -fsSL https://jscpd.dev/install.sh | bash',
  npm: 'npm install -g jscpd',
  cargo: 'cargo install jscpd',
  brew: 'brew install jscpd',
  nix: 'nix profile install github:kucherenko/jscpd'
}

const activeTab = ref('curl')
const copied = ref(false)
const commandText = ref<HTMLElement>()

const activeCommand = computed(() => commands[activeTab.value] ?? '')

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(activeCommand.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
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
.hero-terminal-wrapper {
  position: relative;
}

.hero-terminal {
  background: linear-gradient(to bottom right,
    rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.05),
    rgba(var(--ui-color-secondary-rgb, 178, 0, 178), 0.05));
  border: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.15);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.hero-terminal:hover {
  transform: translateY(-2px);
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.06);
  border-bottom: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.1);
}

.terminal-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.dot-red { background: #ef4444; }
.dot-yellow { background: #f59e0b; }
.dot-green { background: #22c55e; }

.terminal-title {
  font-size: 0.8125rem;
  color: var(--ui-text-muted, #94a3b8);
  margin-left: 0.25rem;
}

.install-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.install-tabs {
  display: flex;
  gap: 0.125rem;
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.06);
  border-radius: 0.5rem;
  padding: 0.1875rem;
}

.install-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ui-text-muted, #94a3b8);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  white-space: nowrap;
}

.install-tab:hover {
  color: var(--ui-text, #e2e8f0);
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.08);
}

.install-tab.active {
  color: #fff;
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.2);
  border-color: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.3);
  box-shadow: 0 0 12px rgba(0, 123, 255, 0.15);
}

.tab-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.terminal-body {
  padding: 1rem 1.25rem 1.25rem;
}

.command-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.875rem;
  padding: 0.625rem 0.875rem;
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.08);
  border: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.12);
  border-radius: 0.5rem;
}

.prompt {
  color: #22c55e;
  font-weight: 600;
  flex-shrink: 0;
}

.command-line code {
  color: var(--ui-text, #e2e8f0);
  flex: 1;
  overflow-x: auto;
  white-space: nowrap;
  font-size: 0.8125rem;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.1);
  border: 1px solid rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.15);
  color: var(--ui-text-muted, #94a3b8);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.copy-btn:hover {
  background: rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.2);
  color: var(--ui-text, #e2e8f0);
}

.copy-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.copy-icon.copied {
  color: #22c55e;
}

.terminal-divider {
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(var(--ui-color-primary-rgb, 0, 123, 255), 0.2),
    transparent);
  margin: 0.75rem 0;
}

.terminal-output {
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.8125rem;
}

.output-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-muted { color: var(--ui-text-muted, #94a3b8); }
.text-green-400 { color: #4ade80; }
.text-blue-400 { color: #60a5fa; }

.typing-text {
  overflow: hidden;
  white-space: nowrap;
  animation: typing 3s steps(40, end) forwards;
  border-right: 2px solid transparent;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: currentColor;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes typing {
  from { max-width: 0; }
  to { max-width: 100%; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .terminal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .install-tabs {
    flex-wrap: wrap;
  }

  .command-line {
    font-size: 0.75rem;
  }

  .command-line code {
    font-size: 0.6875rem;
  }
}
</style>