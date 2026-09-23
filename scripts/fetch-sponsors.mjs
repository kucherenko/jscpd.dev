#!/usr/bin/env node
// Refreshes the Open Collective backer list shown on /support.
//
//   node scripts/fetch-sponsors.mjs
//
// Writes data/sponsors.json and self-hosts every avatar under
// public/avatars/oc-*, so the page makes no request to Open Collective or
// Gravatar at render time (same approach as the TweetWall avatars).
// Run it by hand after a new backer shows up; the committed JSON is what
// the build uses.

import { writeFile } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://opencollective.com/jscpd/members/all.json'

// Extensions we are willing to write, keyed by what the CDN reports.
const EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg'
}

// The `image` field in the API points at the original upload — one backer's
// was 2048px/392KB for a 28px slot. Open Collective resizes on demand, so ask
// it for the size the page actually renders (2x of 28px, rounded up).
const AVATAR_HEIGHT = 128

async function downloadAvatar(slug) {
  const res = await fetch(`https://opencollective.com/${slug}/avatar.png?height=${AVATAR_HEIGHT}`)
  // A member with no avatar 404s here, and the page falls back to an initial.
  if (!res.ok) return null
  const ext = EXT[(res.headers.get('content-type') || '').split(';')[0]]
  if (!ext) return null
  const file = `oc-${slug}.${ext}`
  await pipeline(Readable.fromWeb(res.body), createWriteStream(join(root, 'public/avatars', file)))
  return `/avatars/${file}`
}

const res = await fetch(API)
if (!res.ok) throw new Error(`Open Collective returned ${res.status}`)

const backers = (await res.json())
  .filter(m => m.role === 'BACKER')
  .sort((a, b) => (b.totalAmountDonated || 0) - (a.totalAmountDonated || 0))

const sponsors = []
for (const m of backers) {
  const slug = m.profile.split('/').pop()
  sponsors.push({
    name: m.name,
    profile: m.profile,
    website: m.website || null,
    type: m.type,
    avatar: await downloadAvatar(slug)
  })
}

await writeFile(
  join(root, 'data/sponsors.json'),
  JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), sponsors }, null, 2) + '\n'
)

console.log(`${sponsors.length} backers written to data/sponsors.json`)
