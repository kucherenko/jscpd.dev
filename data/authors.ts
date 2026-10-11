// Blog authors, by the id used in a post's `authors` front matter.
export interface Author {
  name: string
  github: string
  x?: string
  avatar: string
}

export const authors: Record<string, Author> = {
  kucherenko: {
    name: 'Andrey Kucherenko',
    github: 'https://github.com/kucherenko',
    x: 'https://x.com/a_kucherenko',
    avatar: 'https://github.com/kucherenko.png?size=96',
  },
}

export function authorsOf(ids: string[] | undefined): Author[] {
  return (ids || []).map(id => authors[id]).filter((a): a is Author => Boolean(a))
}
