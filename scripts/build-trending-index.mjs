#!/usr/bin/env node
/**
 * Rebuild the derived trending data (history index, per-repo files, latest
 * copy) from the daily snapshots in data/trending/. Run after adding or
 * editing a snapshot by hand:  node scripts/build-trending-index.mjs
 */
import { buildIndex } from './trending-lib.mjs'

const { days, repos } = await buildIndex()
console.log(`trending index: ${days} days, ${repos} repos`)
