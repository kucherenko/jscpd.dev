<script setup lang="ts">
// The authors of a post: avatar, name linked to GitHub, and an X link when
// the author has one. Ids come from the post's front matter.
import { authorsOf, type Author } from '~/data/authors'

const props = defineProps<{ ids?: string[], compact?: boolean }>()
const list = computed(() => authorsOf(props.ids))

// One icon link per profile the author has, in this order.
const profiles = (author: Author) => [
  { href: author.github, icon: 'simple-icons:github', label: 'GitHub' },
  { href: author.x, icon: 'simple-icons:x', label: 'X' },
  { href: author.linkedin, icon: 'simple-icons:linkedin', label: 'LinkedIn' },
  { href: author.telegram, icon: 'simple-icons:telegram', label: 'Telegram' },
].filter((p): p is { href: string, icon: string, label: string } => Boolean(p.href))
</script>

<template>
  <ul class="blog-authors" :class="{ compact }">
    <li v-for="author in list" :key="author.github" class="blog-author">
      <img :src="author.avatar" :alt="`${author.name} avatar`" width="28" height="28" loading="lazy" class="blog-author-avatar">
      <a :href="author.github" target="_blank" rel="noopener" class="blog-author-name">{{ author.name }}</a>
      <a
        v-for="profile in profiles(author)"
        :key="profile.label"
        :href="profile.href"
        target="_blank"
        rel="noopener"
        class="blog-author-link"
        :aria-label="`${author.name} on ${profile.label}`"
        :title="profile.label"
      >
        <Icon :name="profile.icon" class="blog-author-icon" />
      </a>
    </li>
  </ul>
</template>

<style scoped>
.blog-authors {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.blog-author {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.compact .blog-author {
  font-size: 0.8125rem;
}

.blog-author-avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  flex: none;
}

.compact .blog-author-avatar {
  width: 1.375rem;
  height: 1.375rem;
}

.blog-author-name {
  color: var(--ui-text-highlighted, inherit);
  font-weight: 500;
  text-decoration: none;
}

.blog-author-name:hover {
  text-decoration: underline;
}

.blog-author-link {
  display: inline-flex;
  color: var(--ui-text-muted, #64748b);
}

.blog-author-link:hover {
  color: var(--jscpd-blue, #007bff);
}

.blog-author-icon {
  width: 1rem;
  height: 1rem;
}
</style>
