<template>
  <div class="tweet-wall">
    <div class="tweet-wall-columns">
      <a
        v-for="tweet in tweets"
        :key="tweet.url"
        :href="tweet.url"
        target="_blank"
        rel="noopener"
        class="tweet-card"
      >
        <div class="tweet-card-header">
          <img
            :src="tweet.avatar"
            :alt="tweet.name"
            class="tweet-card-avatar"
            loading="lazy"
            width="32"
            height="32"
          >
          <div class="tweet-card-author">
            <span class="tweet-card-name">{{ tweet.name }}</span>
            <span class="tweet-card-handle">{{ tweet.handle }}</span>
          </div>
          <Icon name="simple-icons:x" class="tweet-card-icon" />
        </div>
        <p class="tweet-card-text">{{ tweet.text }}</p>
        <span class="tweet-card-date">{{ tweet.date }}</span>
      </a>
    </div>
    <div class="tweet-wall-more">
      <UButton
        to="https://x.com/search?q=jscpd"
        target="_blank"
        color="neutral"
        variant="outline"
        icon="i-simple-icons-x"
        label="See more mentions on X"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Real posts collected from x.com/search?q=jscpd — text is quoted verbatim
// (long posts trimmed with an ellipsis), so only edit alongside the source.
const tweets = [
  {
    name: 'Cory House',
    handle: '@housecor',
    avatar: '/avatars/housecor.jpg',
    date: 'Apr 2025',
    url: 'https://x.com/housecor/status/1910029435656429859',
    text: 'One of my favorite tools during a code audit is jscpd. It detects copy/pasted code.\n\nIn a codebase I’m currently reviewing, nearly half of the JS is duplicated!\n\njscpd lists the specific duplicated spots so we can consider a cleanup.'
  },
  {
    name: 'Matt Pocock',
    handle: '@mattpocockuk',
    avatar: '/avatars/mattpocockuk.jpg',
    date: 'Mar 2025',
    url: 'https://x.com/mattpocockuk/status/1902792402395435386',
    text: 'Get AI to reduce duplicated code, reduce the jscpd number'
  },
  {
    name: 'Peter Steinberger',
    handle: '@steipete',
    avatar: '/avatars/steipete.png',
    date: 'Sep 2025',
    url: 'https://x.com/steipete/status/1964386305095385455',
    text: 'I du regular sweeps with jscpd, ran a Socrates analysis yesterday and it was in the single digits. Could purge more, but writing overly generic code has its own problems.'
  },
  {
    name: 'nark3d',
    handle: '@nark3d',
    avatar: '/avatars/nark3d.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/nark3d/status/2064284277374673391',
    text: 'Same here, jscpd and the linter both sit in our CI gate. The thing that surprised me is it holds up better with agents than a review comment does. An agent will argue a comment, but a failing build just stops it, so the duplication never gets in.'
  },
  {
    name: 'Maximilian',
    handle: '@_maxscn',
    avatar: '/avatars/_maxscn.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/_maxscn/status/2062892515510960627',
    text: 'just added a jscpd pre-commit hook and why did i not do this ages ago'
  },
  {
    name: 'Cory House',
    handle: '@housecor',
    avatar: '/avatars/housecor.jpg',
    date: 'Apr 2024',
    url: 'https://x.com/housecor/status/1782030911292235959',
    text: 'Problem: You want to find copy/pasted code.\n\nSolution: jscpd.\n\nIt finds copy/pasted code in over 150 languages. I just ran this command on a JS project:\n\nnpx jscpd --ignore "**/node_modules/**"\n\nIt found over 6,000+ lines of duplicated code.'
  },
  {
    name: '.',
    handle: '@sjallatak',
    avatar: '/avatars/sjallatak.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/sjallatak/status/2064094684922708211',
    text: 'a good way to minimize slop in a typescript codebase is a forced validation command of knip, jscpd and linter of your choice. the more static validation you have the better.'
  },
  {
    name: 'Andrey Kucherenko',
    handle: '@a_kucherenko',
    avatar: '/avatars/a_kucherenko.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/a_kucherenko/status/2064335265745826156',
    text: 'jscpd v5: 83 seconds → 3.4 seconds.\nThe copy-paste detector for source code is now 24–37x faster — a complete rewrite of the engine in Rust.'
  },
  {
    name: 'matt sephton',
    handle: '@gingerbeardman',
    avatar: '/avatars/gingerbeardman.jpg',
    date: 'Mar 2026',
    url: 'https://x.com/gingerbeardman/status/2032168777278730263',
    text: 'Been experimenting with jscpd to spot similar code that I might be able to refactor, with the goal of simplifying and optimising and hopefully shave some bytes off my apps.\n\nWorks with 150+ formats.'
  },
  {
    name: 'nark3d',
    handle: '@nark3d',
    avatar: '/avatars/nark3d.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/nark3d/status/2063256643811340305',
    text: 'I’ve got jscpd in the pre-commit hook for the same reason. It catches the duplicate before commit instead of in review, and review misses copy-paste because each diff reads fine alone. Gets more useful the more an agent repeats the same helper.'
  },
  {
    name: 'harjot.co',
    handle: '@harjjotsinghh',
    avatar: '/avatars/harjjotsinghh.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/harjjotsinghh/status/2061572128739344727',
    text: 'jscpd is genuinely one of those quietly-everywhere dev tools, congrats on the milestone. a small OSS project really can outlast flashier ones…'
  },
  {
    name: 'Cory House',
    handle: '@housecor',
    avatar: '/avatars/housecor.jpg',
    date: 'Jan 2024',
    url: 'https://x.com/housecor/status/1751269325313355971',
    text: 'Problem: Your code base probably contains a lot of copy/pasted code, but it’s hard to find.\n\nSolution: jscpd\n\njscpd is a command line tool that finds copy/pasted code and reports specific duplicated lines. Works for over 150 languages.'
  },
  {
    name: 'Andrey Kucherenko',
    handle: '@a_kucherenko',
    avatar: '/avatars/a_kucherenko.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/a_kucherenko/status/2061475353609089319',
    text: 'A small open-source project can go a long way.\n\nMy GitHub project jscpd has now surpassed 1.2 million weekly downloads on npm.'
  }
]
</script>

<style scoped>
.tweet-wall {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tweet-wall-columns {
  column-count: 3;
  column-gap: 0.875rem;
}

@media (max-width: 1024px) {
  .tweet-wall-columns {
    column-count: 2;
  }
}

@media (max-width: 640px) {
  .tweet-wall-columns {
    column-count: 1;
  }
}

.tweet-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  break-inside: avoid;
  margin-bottom: 0.875rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
  background: var(--ui-bg, transparent);
  text-decoration: none;
  transition: all 0.2s ease;
}

.tweet-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 123, 255, 0.4);
  box-shadow: 0 8px 20px rgba(0, 123, 255, 0.1);
}

.tweet-card-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.tweet-card-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.tweet-card-author {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.tweet-card-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tweet-card-handle {
  font-size: 0.75rem;
  color: var(--ui-text-muted, #64748b);
}

.tweet-card-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  align-self: flex-start;
  color: var(--ui-text-muted, #64748b);
  opacity: 0.6;
}

.tweet-card-text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--ui-text, inherit);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.tweet-card-date {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.tweet-wall-more {
  display: flex;
  justify-content: center;
}
</style>
