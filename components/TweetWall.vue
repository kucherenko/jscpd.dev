<template>
  <div class="tweet-wall">
    <ClientOnly>
      <div :key="theme" ref="wall" class="tweet-wall-grid">
        <blockquote class="twitter-tweet" :data-theme="theme" data-dnt="true">
          <p lang="en" dir="ltr">
            Problem: Your code base probably contains a lot of copy/pasted code,
            but it's hard to find.<br><br>Solution: jscpd<br><br>jscpd is a command
            line tool that finds copy/pasted code and reports specific duplicated
            lines. Works for over 150 languages.
          </p>
          &mdash; Cory House (@housecor)
          <a href="https://twitter.com/housecor/status/1751269325313355971">January 27, 2024</a>
        </blockquote>
        <blockquote class="twitter-tweet" :data-theme="theme" data-dnt="true">
          <p lang="en" dir="ltr">
            Problem: You want to find copy/pasted code.<br><br>Solution: jscpd.
            It finds copy/pasted code in over 150 languages. I just ran this
            command on a JS project:<br><br>npx jscpd --ignore "**/node_modules/**"<br><br>
            It found over 6,000+ lines of duplicated code.
          </p>
          &mdash; Cory House (@housecor)
          <a href="https://twitter.com/housecor/status/1782030911292235959">April 21, 2024</a>
        </blockquote>
      </div>
    </ClientOnly>
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
import { computed, onMounted, ref, watch, nextTick } from 'vue'

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } }
  }
}

const colorMode = useColorMode()
const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'))
const wall = ref<HTMLElement>()

let pollTimer: ReturnType<typeof setInterval> | undefined

function renderTweets() {
  const tryLoad = () => {
    if (window.twttr?.widgets) {
      window.twttr.widgets.load(wall.value)
      return true
    }
    return false
  }
  if (tryLoad()) return
  if (!document.getElementById('twitter-widgets-js')) {
    const script = document.createElement('script')
    script.id = 'twitter-widgets-js'
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    document.head.appendChild(script)
  }
  // widgets.js only auto-scans once on its own load; poll until its API
  // is ready so late-created blockquotes still get processed.
  if (pollTimer) clearInterval(pollTimer)
  const startedAt = Date.now()
  pollTimer = setInterval(() => {
    if (tryLoad() || Date.now() - startedAt > 20000) {
      clearInterval(pollTimer)
      pollTimer = undefined
    }
  }, 400)
}

onMounted(renderTweets)

// The :key on the grid recreates the blockquotes when the theme flips,
// so widgets.js has to process them again.
watch(theme, () => nextTick(renderTweets))
</script>

<style scoped>
.tweet-wall {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tweet-wall-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 1rem;
  align-items: start;
}

/* Fallback styling while widgets.js loads (or if it's blocked) */
.tweet-wall-grid :deep(blockquote.twitter-tweet) {
  margin: 0;
  padding: 1.25rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--ui-text-muted, #64748b);
  max-width: 100%;
  overflow-wrap: anywhere;
}

.tweet-wall-grid :deep(blockquote.twitter-tweet a) {
  color: var(--jscpd-blue, #007bff);
}

.tweet-wall-grid :deep(iframe) {
  max-width: 100% !important;
}

.tweet-wall-more {
  display: flex;
  justify-content: center;
}
</style>
