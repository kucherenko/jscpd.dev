// A post's date is a YYYY-MM-DD string in its front matter; render it the
// same way on the list, the post and the feed.
export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
