<template>
  <div class="who-uses">
    <div class="who-uses-platforms">
      <a
        v-for="platform in platforms"
        :key="platform.name"
        :href="platform.url"
        target="_blank"
        rel="noopener"
        class="platform-card"
      >
        <Icon :name="platform.icon" class="platform-icon" />
        <div class="platform-info">
          <span class="platform-name">{{ platform.name }}</span>
          <span class="platform-desc">{{ platform.description }}</span>
        </div>
      </a>
    </div>

    <div class="who-uses-projects">
      <span class="projects-label">Also found in</span>
      <div class="project-pills">
        <a
          v-for="project in projects"
          :key="project.name"
          :href="project.url"
          target="_blank"
          rel="noopener"
          class="project-pill"
        >{{ project.name }}</a>
      </div>
    </div>

    <p class="who-uses-stats">
      <strong>10M+</strong> npm downloads / month &middot;
      <a href="https://github.com/kucherenko/jscpd/network/dependents" target="_blank" rel="noopener"><strong>~5,000</strong> repositories</a>
      declare jscpd on GitHub's dependents graph
    </p>
  </div>
</template>

<script setup lang="ts">
const platforms = [
  {
    name: 'GitHub Super Linter',
    description: 'Official GitHub linter aggregator — bundles jscpd as its copy/paste detector',
    icon: 'simple-icons:github',
    url: 'https://github.com/super-linter/super-linter'
  },
  {
    name: 'MegaLinter',
    description: 'Open-source linter aggregator for CI — ships jscpd in every flavor',
    icon: 'lucide:layers',
    url: 'https://github.com/oxsecurity/megalinter'
  },
  {
    name: 'Codacy',
    description: 'Automated code analysis platform — jscpd powers the duplication engine',
    icon: 'lucide:badge-check',
    url: 'https://www.codacy.com/'
  }
]

const projects = [
  { name: 'Microsoft TypeAgent', url: 'https://github.com/microsoft/TypeAgent' },
  { name: 'Salesforce DX VS Code', url: 'https://github.com/forcedotcom/salesforcedx-vscode' },
  { name: 'OVHcloud manager', url: 'https://github.com/ovh/manager' },
  { name: 'MEGA webclient', url: 'https://github.com/meganz/webclient' },
  { name: 'Alibaba AppWorks', url: 'https://github.com/apptools-lab/AppWorks' },
  { name: 'degit', url: 'https://github.com/Rich-Harris/degit' },
  { name: 'OpenClaw', url: 'https://github.com/openclaw/openclaw' },
  { name: 'DeepSeek Harness', url: 'https://github.com/deepseek-ai/deepseek-harness' },
  { name: 'KiroCrew', url: 'https://github.com/kirodotdev/KiroCrew' }
]
</script>

<style scoped>
.who-uses {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.who-uses-platforms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.platform-card {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1.25rem;
  border: 1px solid rgba(0, 123, 255, 0.15);
  border-radius: 0.75rem;
  background: linear-gradient(to bottom right, rgba(0, 123, 255, 0.04), rgba(178, 0, 178, 0.04));
  transition: all 0.3s ease;
  text-decoration: none;
}

.platform-card:hover {
  transform: translateY(-3px);
  border-color: rgba(0, 123, 255, 0.35);
  box-shadow: 0 10px 25px rgba(0, 123, 255, 0.12);
}

.platform-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  color: var(--jscpd-blue, #007bff);
}

.platform-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.platform-name {
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}

.platform-desc {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--ui-text-muted, #64748b);
}

.who-uses-projects {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.projects-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ui-text-muted, #64748b);
}

.project-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-pill {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 9999px;
  color: var(--ui-text-muted, #64748b);
  background: transparent;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.project-pill:hover {
  color: var(--jscpd-blue, #007bff);
  border-color: rgba(0, 123, 255, 0.4);
  background: rgba(0, 123, 255, 0.06);
}

.who-uses-stats {
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
  margin: 0;
}

.who-uses-stats a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
