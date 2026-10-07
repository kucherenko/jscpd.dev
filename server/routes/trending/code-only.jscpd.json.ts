// The config of the trending pipeline's code-only scan, served so a reader
// can measure their own repository the way the baselines were measured:
// curl -fsSLO https://jscpd.dev/trending/code-only.jscpd.json && jscpd -c code-only.jscpd.json .
// Read from the baselines file build-trending-index.mjs derives (its
// `method` is scripts/trending-rules.mjs' codeScanConfig()), bundled at build
// time like the health corpus and prerendered because nuxt.config.ts lists
// the route. A file in public/trending/ would do the same job, but a
// public/trending/ directory makes the dev server redirect /trending to
// /trending/.
import baselines from '../../../data/trending-baselines.json'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  return JSON.stringify(baselines.method, null, 2) + '\n'
})
