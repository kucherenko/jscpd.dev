#!/usr/bin/env bash
# Regenerates the three reference pages from the latest jscpd release and
# fails when the committed pages differ, so the docs cannot fall behind the
# CLI, the Action or the format list. Runs in CI (ci.yml) and by hand:
#
#   scripts/check-reference-drift.sh            # latest release on npm
#   scripts/check-reference-drift.sh 5.4.0      # a given release
#
# The binary comes from npm (the installer script is blocked for GitHub
# runners by Cloudflare's challenge), the sources from the release tag.
set -euo pipefail
cd "$(dirname "$0")/.."

version="${1:-$(npm view jscpd version)}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

raw="https://raw.githubusercontent.com/kucherenko/jscpd/v${version}"
curl -fsSL "$raw/rust/crates/cpd/src/cli.rs" -o "$tmp/cli.rs"
curl -fsSL "$raw/action.yml" -o "$tmp/action.yml"
curl -fsSL "$raw/FORMATS.md" -o "$tmp/FORMATS.md"

# npx resolves the platform package of that exact version
JSCPD_BIN="npx -y jscpd@${version}" node scripts/sync-cli-reference.mjs "$tmp/cli.rs"
node scripts/sync-action-reference.mjs "$tmp/action.yml" "$version"
node scripts/sync-formats-reference.mjs "$tmp/FORMATS.md" "$version"

if ! git diff --quiet -- content/4.reference/1.cli.md content/4.reference/5.supported-formats.md content/4.reference/6.github-action.md; then
  echo "The reference pages are behind jscpd ${version}. Commit the regenerated files:" >&2
  git --no-pager diff --stat -- content/4.reference >&2
  exit 1
fi
echo "reference pages match jscpd ${version}"
