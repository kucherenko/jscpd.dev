// Atom feed of the blog, prerendered at /blog/feed.xml. Entries carry the
// post's description; the post itself is on the site.
import { queryCollection } from '@nuxt/content/server'
import { getSiteConfig } from '#site-config/server/composables'
import { authorsOf } from '../../../data/authors'

interface Post {
  path: string
  title: string
  description?: string
  date: string
  publishedAt: string
  authors?: string[]
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;' })[c] as string)
}

export default defineEventHandler(async (event) => {
  const siteUrl = (getSiteConfig(event).url || 'https://jscpd.dev').replace(/\/+$/, '')
  const posts = await (queryCollection as unknown as (
    event: unknown,
    collection: string,
  ) => { where: (field: string, op: string, value: string) => { order: (field: string, dir: 'ASC' | 'DESC') => { all: () => Promise<Post[]> } } })(event, 'blog').where('publishedAt', '<=', new Date().toISOString()).order('date', 'DESC').all()

  const updated = posts[0]?.date ? `${posts[0].date}T00:00:00Z` : new Date().toISOString()
  const entries = posts.map((post) => {
    const url = `${siteUrl}${post.path}`
    const people = authorsOf(post.authors).map(a => `    <author><name>${escapeXml(a.name)}</name><uri>${escapeXml(a.github)}</uri></author>`).join('\n')
    return [
      '  <entry>',
      `    <title>${escapeXml(post.title)}</title>`,
      `    <link href="${url}"/>`,
      `    <id>${url}</id>`,
      `    <published>${post.date}T00:00:00Z</published>`,
      `    <updated>${post.date}T00:00:00Z</updated>`,
      people,
      `    <summary>${escapeXml(post.description || '')}</summary>`,
      '  </entry>',
    ].filter(Boolean).join('\n')
  }).join('\n')

  setHeader(event, 'content-type', 'application/atom+xml; charset=utf-8')
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    '  <title>jscpd blog</title>',
    '  <subtitle>Release notes with commands and real output, and notes on how jscpd finds what it finds.</subtitle>',
    `  <link href="${siteUrl}/blog/feed.xml" rel="self"/>`,
    `  <link href="${siteUrl}/blog"/>`,
    `  <id>${siteUrl}/blog</id>`,
    `  <updated>${updated}</updated>`,
    entries,
    '</feed>',
    '',
  ].join('\n')
})
