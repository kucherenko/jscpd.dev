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
        <p class="tweet-card-text" :lang="tweet.lang || 'en'">{{ tweet.text }}</p>
        <div class="tweet-card-footer">
          <span v-if="tweet.likes" class="tweet-card-stat">
            <Icon name="lucide:heart" class="tweet-card-stat-icon" />{{ formatCount(tweet.likes) }}
          </span>
          <span v-if="tweet.reposts" class="tweet-card-stat">
            <Icon name="lucide:repeat-2" class="tweet-card-stat-icon" />{{ formatCount(tweet.reposts) }}
          </span>
          <span v-if="tweet.views" class="tweet-card-stat">
            <Icon name="lucide:eye" class="tweet-card-stat-icon" />{{ formatCount(tweet.views) }}
          </span>
          <span class="tweet-card-date">{{ tweet.date }}</span>
        </div>
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
// (long posts trimmed with an ellipsis), non-English posts keep their
// original language. Stats are a snapshot from the collection date
// (2026-09-01); avatars are self-hosted under /public/avatars.
const tweets = [
  {
    name: 'Cory House',
    handle: '@housecor',
    avatar: '/avatars/housecor.jpg',
    date: 'Apr 2025',
    url: 'https://x.com/housecor/status/1910029435656429859',
    likes: 348,
    reposts: 32,
    views: 22800,
    text: 'One of my favorite tools during a code audit is jscpd. It detects copy/pasted code.\n\nIn a codebase I’m currently reviewing, nearly half of the JS is duplicated!\n\njscpd lists the specific duplicated spots so we can consider a cleanup.'
  },
  {
    name: 'Matt Pocock',
    handle: '@mattpocockuk',
    avatar: '/avatars/mattpocockuk.jpg',
    date: 'Mar 2025',
    url: 'https://x.com/mattpocockuk/status/1902792402395435386',
    likes: 1,
    reposts: 0,
    views: 561,
    text: 'Get AI to reduce duplicated code, reduce the jscpd number'
  },
  {
    name: 'Peter Steinberger',
    handle: '@steipete',
    avatar: '/avatars/steipete.png',
    date: 'Sep 2025',
    url: 'https://x.com/steipete/status/1964386305095385455',
    likes: 2,
    reposts: 0,
    views: 155,
    text: 'I du regular sweeps with jscpd, ran a Socrates analysis yesterday and it was in the single digits. Could purge more, but writing overly generic code has its own problems.'
  },
  {
    name: 'nark3d',
    handle: '@nark3d',
    avatar: '/avatars/nark3d.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/nark3d/status/2064284277374673391',
    likes: 2,
    reposts: 0,
    views: 60,
    text: 'Same here, jscpd and the linter both sit in our CI gate. The thing that surprised me is it holds up better with agents than a review comment does. An agent will argue a comment, but a failing build just stops it, so the duplication never gets in.'
  },
  {
    name: '高橋 俊 | CTO - ZENSHIN',
    handle: '@suguru_takaha4',
    avatar: '/avatars/suguru_takaha4.jpg',
    date: 'Jul 2026',
    url: 'https://x.com/suguru_takaha4/status/2074491087599898668',
    likes: 2,
    reposts: 0,
    views: 107,
    lang: 'ja',
    text: 'jscpd というコピペコードを検出する静的解析ツールいいかもしれない\n\n結局コード品質を担保するにはAIに逐一指示するというアプローチよりは静的解析ツールとかでガチガチに縛ってしまった方が気持ち的に大胆にリファクタリングしやすい'
  },
  {
    name: 'Maximilian',
    handle: '@_maxscn',
    avatar: '/avatars/_maxscn.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/_maxscn/status/2062892515510960627',
    likes: 1,
    reposts: 0,
    views: 72,
    text: 'just added a jscpd pre-commit hook and why did i not do this ages ago'
  },
  {
    name: 'Cory House',
    handle: '@housecor',
    avatar: '/avatars/housecor.jpg',
    date: 'Apr 2024',
    url: 'https://x.com/housecor/status/1782030911292235959',
    likes: 719,
    reposts: 70,
    views: 69000,
    text: 'Problem: You want to find copy/pasted code.\n\nSolution: jscpd.\n\nIt finds copy/pasted code in over 150 languages. I just ran this command on a JS project:\n\nnpx jscpd --ignore "**/node_modules/**"\n\nIt found over 6,000+ lines of duplicated code.'
  },
  {
    name: 'Chris Cheney',
    handle: '@_cheney',
    avatar: '/avatars/_cheney.jpg',
    date: 'Aug 2026',
    url: 'https://x.com/_cheney/status/2090870747417743500',
    likes: 6,
    reposts: 0,
    views: 545,
    text: 'I break my specs into directed acyclic graphs in order to identify what work depends on other work and which tasks can be worked in parallel. I also run jscpd in pre-commit which helps cleanup duplicate code and interfaces. See my GitHub DAG project as an example of this'
  },
  {
    name: '.',
    handle: '@sjallatak',
    avatar: '/avatars/sjallatak.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/sjallatak/status/2064094684922708211',
    likes: 1,
    reposts: 0,
    views: 151,
    text: 'a good way to minimize slop in a typescript codebase is a forced validation command of knip, jscpd and linter of your choice. the more static validation you have the better.'
  },
  {
    name: 'HARUKI / UNCHAIN Community Lead',
    handle: '@haruki_web3',
    avatar: '/avatars/haruki_web3.jpg',
    date: 'Jul 2026',
    url: 'https://x.com/haruki_web3/status/2078352818092814765',
    likes: 4,
    reposts: 0,
    views: 325,
    lang: 'ja',
    text: '重複コードを消すツール！\nこれも良さそう！！'
  },
  {
    name: 'matt sephton',
    handle: '@gingerbeardman',
    avatar: '/avatars/gingerbeardman.jpg',
    date: 'Mar 2026',
    url: 'https://x.com/gingerbeardman/status/2032168777278730263',
    likes: 4,
    reposts: 0,
    views: 332,
    text: 'Been experimenting with jscpd to spot similar code that I might be able to refactor, with the goal of simplifying and optimising and hopefully shave some bytes off my apps.\n\nWorks with 150+ formats.'
  },
  {
    name: 'nark3d',
    handle: '@nark3d',
    avatar: '/avatars/nark3d.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/nark3d/status/2063256643811340305',
    likes: 1,
    reposts: 0,
    views: 72,
    text: 'I’ve got jscpd in the pre-commit hook for the same reason. It catches the duplicate before commit instead of in review, and review misses copy-paste because each diff reads fine alone. Gets more useful the more an agent repeats the same helper.'
  },
  {
    name: 'BudgetIce',
    handle: '@BudgetIce37955',
    avatar: '/avatars/budgetice.jpg',
    date: 'Jul 2026',
    url: 'https://x.com/BudgetIce37955/status/2080338676505333763',
    likes: 3,
    reposts: 0,
    views: 44,
    lang: 'ja',
    text: '知らせる層は knip(デッドコード)と jscpd(重複)。\nこっちは止めずに、気づかせるだけの設定\n\nあとは"入れて終わり"にしたくなかったので、既存のコードで溜まってた借金を返すEpicも立てて、子Issue10件で完走'
  },
  {
    name: 'harjot.co',
    handle: '@harjjotsinghh',
    avatar: '/avatars/harjjotsinghh.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/harjjotsinghh/status/2061572128739344727',
    likes: 2,
    reposts: 0,
    views: 29,
    text: 'jscpd is genuinely one of those quietly-everywhere dev tools, congrats on the milestone. a small OSS project really can outlast flashier ones…'
  },
  {
    name: 'Cory House',
    handle: '@housecor',
    avatar: '/avatars/housecor.jpg',
    date: 'Jan 2024',
    url: 'https://x.com/housecor/status/1751269325313355971',
    likes: 4154,
    reposts: 502,
    views: 573000,
    text: 'Problem: Your code base probably contains a lot of copy/pasted code, but it’s hard to find.\n\nSolution: jscpd\n\njscpd is a command line tool that finds copy/pasted code and reports specific duplicated lines. Works for over 150 languages.'
  },
  {
    name: 'Andrey Kucherenko',
    handle: '@a_kucherenko',
    avatar: '/avatars/a_kucherenko.jpg',
    date: 'Jun 2026',
    url: 'https://x.com/a_kucherenko/status/2061475353609089319',
    likes: 5,
    reposts: 1,
    views: 168,
    text: 'A small open-source project can go a long way.\n\nMy GitHub project jscpd has now surpassed 1.2 million weekly downloads on npm.'
  }
]

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}
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

.tweet-card-footer {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.tweet-card-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.tweet-card-stat-icon {
  width: 0.75rem;
  height: 0.75rem;
  opacity: 0.7;
}

.tweet-card-date {
  margin-left: auto;
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
}

.tweet-wall-more {
  display: flex;
  justify-content: center;
}
</style>
