export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      neutral: 'slate'
    },
    primary: '#007bff',
    secondary: '#B200B2'
  },
  seo: {
    siteName: 'jscpd - Copy/Paste Detector'
  },
  site: {
    url: 'https://jscpd.dev',
    name: 'jscpd',
    description: 'Copy/paste detector for programming source code. Rust-powered, 24-37x faster.',
    ogImage: 'https://jscpd.dev/og.png'
  },
  toc: {
    title: 'On this page',
    bottom: {
      title: 'Community',
      links: [
        {
          icon: 'simple-icons-github',
          label: 'Star on GitHub',
          to: 'https://github.com/kucherenko/jscpd',
          target: '_blank'
        },
        {
          icon: 'simple-icons-npm',
          label: 'View on npm',
          to: 'https://www.npmjs.com/package/jscpd',
          target: '_blank'
        },
        {
          icon: 'simple-icons-opencollective',
          label: 'Sponsor',
          to: 'https://opencollective.com/jscpd',
          target: '_blank'
        },
        {
          icon: 'simple-icons-rust',
          label: 'Rust crate',
          to: 'https://crates.io/crates/jscpd',
          target: '_blank'
        }
      ]
    }
  },
  header: {
    title: 'jscpd',
    to: '/',
    logo: {
      light: '/logo-v3.svg',
      dark: '/logo-dark-v3.svg'
    }
  },
  // Docus builds the "Edit this page" link (and "Report an issue") from this
  // entry, so it must point at the repository that holds content/ — this one,
  // not the jscpd tool repo. The header/footer links to the tool repo are set
  // explicitly in components/app/.
  github: {
    url: 'https://github.com/kucherenko/jscpd.dev',
    branch: 'master'
  },
  footer: {
    credits: 'Copyright © 2013-2026 Andrey Kucherenko'
  }
})
