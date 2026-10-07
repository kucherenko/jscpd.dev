<script lang="ts" setup>
// The social card of the trending pages: the number a reader would quote,
// big, next to the title and a line of context, in the look of the docus
// Docs card (components/OgImage/Docs.takumi.vue in the docus layer).
const { headline, title, description, value, label, tone } = defineProps<{
  headline?: string
  title?: string
  description?: string
  /** The number shown big, e.g. "4.3%". */
  value?: string
  /** What the number is, e.g. "duplicated code". */
  label?: string
  /** Colour of the number, the same scale as the dup-* badges. */
  tone?: 'low' | 'mid' | 'high'
}>()

const appConfig = useAppConfig()
const { name: siteName } = useSiteConfig()
const primaryColor = appConfig.ui?.colors?.primary ?? 'blue'
const toneClass = { low: 'text-green-400', mid: 'text-amber-400', high: 'text-red-400' }[tone ?? 'mid']
</script>

<template>
  <div class="w-full h-full flex flex-col justify-between bg-neutral-950 px-[80px] py-[60px]">
    <div class="absolute top-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_40%,transparent_70%)]" />
    <div class="absolute top-0 right-0 w-[350px] h-[350px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_35%,transparent_65%)]" />

    <div class="flex-1 flex flex-row items-center justify-between">
      <div class="flex flex-col justify-center w-full max-w-[640px]">
        <p
          v-if="headline"
          :class="`uppercase text-[22px] font-bold m-0 mb-5 tracking-[0.05em] text-${primaryColor}-500`"
        >
          {{ headline }}
        </p>
        <h1
          v-if="title"
          class="m-0 mb-6 text-[50px] font-bold text-white leading-[1.1] w-full wrap-break-word"
        >
          {{ title?.slice(0, 60) }}
        </h1>
        <p
          v-if="description"
          class="m-0 text-[26px] text-neutral-400 leading-[1.4] w-full wrap-break-word"
        >
          {{ description?.slice(0, 160) }}
        </p>
      </div>
      <div v-if="value" class="flex flex-col items-end justify-center ml-[40px]">
        <p :class="`m-0 text-[120px] font-bold leading-[1] ${toneClass}`">
          {{ value }}
        </p>
        <p v-if="label" class="m-0 mt-3 text-[24px] text-neutral-400 text-right">
          {{ label }}
        </p>
      </div>
    </div>

    <div class="flex">
      <div class="text-white text-[18px] font-normal rounded-lg px-5 py-2">
        {{ siteName }}
      </div>
    </div>
  </div>
</template>
