<script setup lang="ts">
// The editors the guide covers, as a row of logos that jump to their
// sections, most used first (the order of the Stack Overflow developer
// survey). Mono brand icons come from the simple-icons set in their brand
// colours; JetBrains and VS Code use the same marks as the landing page.
interface Editor {
  name: string
  to: string
  how: string
  icon?: string
  mode?: 'svg'
  img?: string
  color?: string
  dark?: string
}

const editors: Editor[] = [
  { name: 'VS Code', to: '#vs-code', how: 'extension on the Marketplace', icon: 'vscode-icons:file-type-vscode', mode: 'svg' },
  { name: 'JetBrains IDEs', to: '#jetbrains-ides', how: 'plugin on the Marketplace', img: '/jetbrains-mark.svg' },
  { name: 'Neovim', to: '#neovim', how: 'a few lines of config', icon: 'simple-icons:neovim', color: '#57a143' },
  { name: 'Sublime Text', to: '#sublime-text', how: 'LSP package', icon: 'simple-icons:sublimetext', color: '#ff9800' },
  { name: 'Emacs', to: '#emacs', how: 'lsp-mode or Eglot', icon: 'simple-icons:gnuemacs', color: '#7f5ab6', dark: '#b39ddb' },
  { name: 'Zed', to: '#zed', how: 'extension, in review', icon: 'simple-icons:zedindustries', color: '#084ccf', dark: '#7aa7ff' },
  { name: 'Helix', to: '#helix', how: 'a few lines of config', icon: 'simple-icons:helix', color: '#702457', dark: '#c68fb8' },
]
</script>

<template>
  <ul class="editor-logos">
    <li v-for="editor in editors" :key="editor.name">
      <a :href="editor.to" class="editor-logo" :style="{ '--logo': editor.color || 'currentColor', '--logo-dark': editor.dark || editor.color || 'currentColor' }">
        <img v-if="editor.img" :src="editor.img" alt="" width="32" height="32" class="editor-logo-mark">
        <Icon v-else :name="editor.icon!" :mode="editor.mode" class="editor-logo-mark editor-logo-icon" aria-hidden="true" />
        <span class="editor-logo-name">{{ editor.name }}</span>
        <span class="editor-logo-how">{{ editor.how }}</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.editor-logos {
  list-style: none;
  margin: 1.5rem 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  gap: 0.625rem;
}

.editor-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.875rem 0.5rem 0.75rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
  text-align: center;
  text-decoration: none;
  color: var(--ui-text-highlighted, inherit);
  background: var(--ui-bg, transparent);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.editor-logo:hover {
  border-color: rgba(0, 123, 255, 0.4);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.08);
  text-decoration: none;
}

.editor-logo-mark {
  width: 2rem;
  height: 2rem;
  flex: none;
}

.editor-logo-icon {
  color: var(--logo);
}

.dark .editor-logo-icon {
  color: var(--logo-dark);
}

.editor-logo-name {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25;
}

.editor-logo-how {
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--ui-text-muted, #64748b);
}
</style>
