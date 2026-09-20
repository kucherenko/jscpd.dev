// The health-score calibration corpus, served raw at a stable URL for the
// jscpd repo's rust/scripts/calibrate-health.mjs (windowing, dedup and
// medians are the consumer's job). Bundled at build time like the sitemap's
// data imports (node:fs is a stub under the cloudflare preset) and
// prerendered because nuxt.config.ts lists the route — on a static deploy
// an un-prerendered server route would not exist at all.
import corpus from '../../data/health-corpus.json'

export default defineEventHandler(() => corpus)