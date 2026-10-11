// Blog authors, by the id used in a post's `authors` front matter.
export interface Author {
  name: string
  github: string
  x?: string
  linkedin?: string
  telegram?: string
  avatar: string
}

export const authors: Record<string, Author> = {
  kucherenko: {
    name: 'Andrey Kucherenko',
    github: 'https://github.com/kucherenko',
    x: 'https://x.com/a_kucherenko',
    linkedin: 'https://www.linkedin.com/in/andrey-kucherenko-a180aa28/',
    // Math.random(): community of engineers
    telegram: 'https://t.me/mathrandomcommunity',
    avatar: 'https://github.com/kucherenko.png?size=96',
  },
}

export function authorsOf(ids: string[] | undefined): Author[] {
  return (ids || []).map(id => authors[id]).filter((a): a is Author => Boolean(a))
}
