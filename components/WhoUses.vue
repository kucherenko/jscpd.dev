<template>
  <div class="who-uses">
    <div class="who-uses-group">
      <span class="projects-label">Bundled by</span>
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
    </div>

    <div class="who-uses-teams">
      <span class="projects-label">Runs in the repositories of</span>
      <ul class="who-uses-logos">
        <li v-for="user in jscpdUsers" :key="user.logo">
          <a
            :href="user.url"
            target="_blank"
            rel="noopener"
            class="who-uses-logo"
            :title="`${user.name}, ${user.project}: ${user.how}`"
            :style="{ '--logo': user.color, '--logo-dark': user.dark || user.color, '--mark': `url(/logos/${user.logo}.svg)` }"
          >
            <span class="who-uses-mark" aria-hidden="true" />
            <span class="who-uses-name">{{ user.name }}</span>
            <span class="who-uses-project">{{ user.project }}</span>
          </a>
        </li>
      </ul>
      <p class="who-uses-note">
        Each logo opens the file that runs jscpd in the project's public repository. The logos belong to their owners.
      </p>
    </div>

    <p class="who-uses-stats">
      <strong>10M+</strong> npm downloads / month &middot;
      <a href="https://github.com/kucherenko/jscpd/network/dependents" target="_blank" rel="noopener"><strong>6,000+</strong> repositories</a>
      declare jscpd on GitHub's dependents graph &middot;
      <strong>15,500+</strong> workflow files reference Super Linter, which runs jscpd by default
    </p>
  </div>
</template>

<script setup lang="ts">
import { jscpdUsers } from '~/data/users'

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

.who-uses-group,
.who-uses-teams {
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

.who-uses-logos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.625rem;
}

.who-uses-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  height: 100%;
  padding: 1rem 0.5rem 0.875rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
  text-align: center;
  text-decoration: none;
  color: var(--ui-text-muted, #64748b);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.who-uses-logo:hover,
.who-uses-logo:focus-visible {
  color: var(--logo);
  border-color: rgba(0, 123, 255, 0.4);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.08);
}

.dark .who-uses-logo:hover,
.dark .who-uses-logo:focus-visible {
  color: var(--logo-dark);
}

/* The mark is a single-colour SVG used as a mask, so it takes the link's
   colour: grey at rest, the brand colour on hover. */
.who-uses-mark {
  width: 2rem;
  height: 2rem;
  margin-bottom: 0.375rem;
  background-color: currentColor;
  -webkit-mask: var(--mark) center / contain no-repeat;
  mask: var(--mark) center / contain no-repeat;
}

.who-uses-name {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25;
  color: var(--ui-text-highlighted, inherit);
}

.who-uses-project {
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--ui-text-muted, #64748b);
}

.who-uses-note {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ui-text-dimmed, #94a3b8);
}

@media (max-width: 640px) {
  .who-uses-logos {
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    gap: 0.5rem;
  }

  .who-uses-logo {
    padding: 0.75rem 0.25rem 0.625rem;
  }

  .who-uses-mark {
    width: 1.75rem;
    height: 1.75rem;
  }
}

/* On a phone the wall keeps the logos and names, four to a row; the project
   names stay in the link titles and on wider screens. */
@media (max-width: 480px) {
  .who-uses-logos {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .who-uses-mark {
    width: 1.5rem;
    height: 1.5rem;
  }

  .who-uses-name {
    font-size: 0.75rem;
  }

  .who-uses-project {
    display: none;
  }
}

@media (max-width: 359px) {
  .who-uses-logos {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
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
