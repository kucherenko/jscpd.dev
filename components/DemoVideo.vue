<template>
  <figure class="demo-video">
    <video
      ref="player"
      class="demo-video-player"
      :src="src"
      :poster="poster"
      :aria-label="alt"
      autoplay
      loop
      muted
      playsinline
      preload="metadata"
      controls
    ></video>
    <figcaption v-if="caption" class="demo-video-caption">{{ caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
  /** Video URL under /public, e.g. `/video/clone-types.mp4`. */
  src: string
  /** Still frame shown before playback and where autoplay is blocked. */
  poster?: string
  /** Accessible description of what the video shows. */
  alt?: string
  /** Caption rendered under the video. */
  caption?: string
}>()

const player = ref<HTMLVideoElement | null>(null)

// The clips are silent loops, so autoplay is acceptable; readers who asked
// the OS for reduced motion get the poster and the controls instead.
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && player.value) {
    player.value.autoplay = false
    player.value.pause()
  }
})
</script>

<style scoped>
.demo-video {
  margin: 1.5rem auto;
  max-width: 560px;
}

.demo-video-player {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 0.75rem;
  border: 1px solid var(--ui-border, rgba(128, 128, 128, 0.25));
  background: #0b1120;
}

.demo-video-caption {
  margin-top: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #6b7280);
}
</style>
