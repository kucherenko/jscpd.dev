#!/usr/bin/env bash
# jscpd / cpd install script
# Usage: curl -fsSL https://jscpd.dev/install.sh | bash
#        curl -fsSL https://jscpd.dev/install.sh | bash -s -- --version 5.2.1
#        curl -fsSL https://jscpd.dev/install.sh | bash -s -- --prefix ~/bin
#
# Downloads the cpd binary for the current platform and installs it.
# Primary source: GitHub Releases (kucherenko/jscpd), verified against the
#                 sha256 checksums published alongside the release.
# Fallback:       npm registry tarballs, verified against the integrity hash
#                 the registry reports for them.
#
# Options:
#   --version VERSION   Install a specific version (default: latest)
#   --prefix DIR        Installation directory (default: ~/.local/bin)
#   --to DIR            Alias for --prefix
#   --dry-run           Show what would be done without installing
#   --force             Overwrite an existing binary, or downgrade
#   -h, --help          Show this help
#
# Environment:
#   CPD_INSTALL_PREFIX  Default installation directory

set -euo pipefail

REPO="kucherenko/jscpd"
BINARY_NAME="cpd"
ALIAS_NAME="jscpd"
GITHUB_RELEASES_URL="https://github.com/${REPO}/releases"
NPM_REGISTRY="https://registry.npmjs.org"
INSTALL_URL="https://jscpd.dev/install.sh"

VERSION=""
PREFIX=""
DRY_RUN=""
FORCE=""

# Set by detect_platform / the download helpers.
DETECTED_OS=""
DETECTED_CPU=""
PLATFORM_KEY=""
ASSET_SUFFIX=""
NPM_PACKAGE=""
BINARY_PATH=""

# Cleaned up by the EXIT trap.
TMP_DIR=""
STAGED_FILE=""

info()  { printf '\033[1;34m→\033[0m %s\n' "$*" >&2; }
ok()    { printf '\033[1;32m✓\033[0m %s\n' "$*" >&2; }
warn()  { printf '\033[1;33m!\033[0m %s\n' "$*" >&2; }
err()   { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; }
die()   { err "$@"; exit 1; }

cleanup() {
  [ -n "$TMP_DIR" ] && rm -rf "$TMP_DIR"
  [ -n "$STAGED_FILE" ] && rm -f "$STAGED_FILE"
  :
}
trap cleanup EXIT

usage() {
  cat <<EOF
Usage: curl -fsSL ${INSTALL_URL} | bash
       curl -fsSL ${INSTALL_URL} | bash -s -- --version 5.2.1
       curl -fsSL ${INSTALL_URL} | bash -s -- --prefix ~/bin

Options:
  --version VERSION   Install a specific version (default: latest)
  --prefix DIR        Installation directory (default: ~/.local/bin)
  --to DIR            Alias for --prefix
  --dry-run           Show what would be done without installing
  --force             Overwrite an existing binary, or downgrade
  -h, --help          Show this help

Environment:
  CPD_INSTALL_PREFIX  Default installation directory

Downloads are checked against the sha256 sums published with the release.
Pass --version for a reproducible install; without it the newest release is
resolved at run time.
EOF
}

# --- small helpers ---------------------------------------------------------

have() { command -v "$1" >/dev/null 2>&1; }

need_cmd() {
  have "$1" || die "Required command not found: $1"
}

# Every fetch goes through here so the TLS floor is set in exactly one place.
fetch() { curl --proto '=https' --tlsv1.2 -fsSL "$@"; }

is_version() {
  printf '%s' "${1:-}" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+([-+][0-9A-Za-z.-]+)?$'
}

# First "key":"value" pair in a JSON blob. Splitting on structural characters
# first keeps the greedy .* from running past the value we asked for.
json_value() {
  printf '%s' "${2:-}" | tr ',{}[]' '\n\n\n\n\n' \
    | sed -n 's/.*"'"$1"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
    | sed -n '1p'
}

# --- platform detection ----------------------------------------------------

# Alpine's ldd writes its banner to stderr and exits non-zero, so the output is
# captured and the status ignored -- under `set -o pipefail` a bare
# `ldd --version | grep musl` reports the *exit code*, never the match.
detect_libc() {
  local out="" candidate=""
  out="$( (ldd --version) 2>&1 || true )"
  case "$out" in
    *musl*) printf 'musl\n'; return 0 ;;
  esac
  for candidate in /lib/ld-musl-*.so.1 /lib64/ld-musl-*.so.1; do
    if [ -e "$candidate" ]; then printf 'musl\n'; return 0; fi
  done
  printf 'glibc\n'
}

detect_platform() {
  DETECTED_OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
  DETECTED_CPU="$(uname -m)"

  case "$DETECTED_OS" in
    darwin) DETECTED_OS="darwin" ;;
    linux)  DETECTED_OS="linux" ;;
    mingw*|msys*|cygwin*) DETECTED_OS="win32" ;;
    *) die "Unsupported OS: $DETECTED_OS" ;;
  esac

  case "$DETECTED_CPU" in
    x86_64|amd64)  DETECTED_CPU="x64" ;;
    aarch64|arm64) DETECTED_CPU="arm64" ;;
    *) die "Unsupported architecture: $DETECTED_CPU" ;;
  esac

  PLATFORM_KEY="${DETECTED_OS}-${DETECTED_CPU}"
  if [ "$DETECTED_OS" = "linux" ]; then
    PLATFORM_KEY="${PLATFORM_KEY}-$([ "$(detect_libc)" = "musl" ] && echo musl || echo gnu)"
  fi

  case "$PLATFORM_KEY" in
    linux-x64-gnu)     ASSET_SUFFIX="linux-x64-gnu" ;;
    linux-arm64-gnu)   ASSET_SUFFIX="linux-arm64-gnu" ;;
    linux-x64-musl)    ASSET_SUFFIX="linux-x64-musl" ;;
    linux-arm64-musl)  ASSET_SUFFIX="linux-arm64-musl" ;;
    darwin-arm64)      ASSET_SUFFIX="darwin-arm64" ;;
    darwin-x64)        ASSET_SUFFIX="darwin-x64" ;;
    win32-x64)         ASSET_SUFFIX="windows-x64-msvc" ;;
    win32-arm64)       ASSET_SUFFIX="windows-arm64-msvc" ;;
    *) die "No binary available for platform: $PLATFORM_KEY" ;;
  esac

  # The npm packages are named after the release asset, not the platform key:
  # jscpd-windows-x64-msvc, never jscpd-win32-x64.
  NPM_PACKAGE="${ALIAS_NAME}-${ASSET_SUFFIX}"
}

# --- version resolution ----------------------------------------------------

get_latest_version() {
  local version="" body=""

  # /releases/latest redirects to /releases/tag/vX.Y.Z; the effective URL is
  # the version. A failed request still prints the URL it was given, so the
  # result only counts once it looks like a version.
  version="$(fetch -o /dev/null -w '%{url_effective}' "${GITHUB_RELEASES_URL}/latest" 2>/dev/null \
    | sed -n 's|.*/tag/v\{0,1\}||p')" || version=""
  is_version "$version" || version=""

  if [ -z "$version" ]; then
    body="$(fetch "${NPM_REGISTRY}/${BINARY_NAME}/latest" 2>/dev/null)" || body=""
    version="$(json_value version "$body")"
    is_version "$version" || version=""
  fi

  [ -n "$version" ] || die "Could not determine the latest version — retry, or pin one with --version"
  printf '%s\n' "$version"
}

# Numeric major.minor.patch comparison; any -prerelease/+build suffix is
# dropped, so 5.2.1-rc.1 and 5.2.1 compare equal rather than crashing the
# arithmetic.
version_gt() {
  local v1="${1%%[-+]*}" v2="${2%%[-+]*}"
  [ "$v1" = "$v2" ] && return 1

  local a1 b1 c1 a2 b2 c2
  local IFS=.
  # shellcheck disable=SC2086
  set -- $v1 $v2
  a1="$(digits "${1:-0}")"; b1="$(digits "${2:-0}")"; c1="$(digits "${3:-0}")"
  a2="$(digits "${4:-0}")"; b2="$(digits "${5:-0}")"; c2="$(digits "${6:-0}")"

  [ "$a1" -gt "$a2" ] && return 0
  [ "$a1" -lt "$a2" ] && return 1
  [ "$b1" -gt "$b2" ] && return 0
  [ "$b1" -lt "$b2" ] && return 1
  [ "$c1" -gt "$c2" ] && return 0
  return 1
}

digits() {
  case "${1:-}" in
    ''|*[!0-9]*) printf '0\n' ;;
    *) printf '%s\n' "$1" ;;
  esac
}

# --- integrity -------------------------------------------------------------

sha256_of() {
  if have sha256sum; then sha256sum -- "$1" | cut -d' ' -f1
  elif have shasum; then shasum -a 256 -- "$1" | cut -d' ' -f1
  elif have openssl; then openssl dgst -sha256 "$1" | sed 's/.*= *//'
  else return 1
  fi
}

sha1_of() {
  if have sha1sum; then sha1sum -- "$1" | cut -d' ' -f1
  elif have shasum; then shasum -a 1 -- "$1" | cut -d' ' -f1
  else return 1
  fi
}

# A mismatch is fatal: the bytes on disk are not the bytes that were published.
verify_sha256() {
  local file="$1" expected="$2" actual=""
  actual="$(sha256_of "$file")" || {
    warn "No sha256 tool available (sha256sum, shasum or openssl) — skipping verification"
    return 0
  }
  [ "$actual" = "$expected" ] && return 0
  err "Checksum mismatch for $(basename "$file")"
  err "  expected sha256 $expected"
  err "  got      sha256 $actual"
  return 1
}

verify_npm_tarball() {
  local file="$1" integrity="${2:-}" shasum="${3:-}" actual=""

  case "$integrity" in
    sha512-*)
      if have openssl; then
        actual="$(openssl dgst -sha512 -binary "$file" | openssl base64 -A)"
        if [ "$actual" = "${integrity#sha512-}" ]; then
          ok "sha512 verified against the registry integrity hash"
          return 0
        fi
        err "npm integrity mismatch for $(basename "$file")"
        return 1
      fi
      ;;
  esac

  if [ -n "$shasum" ] && actual="$(sha1_of "$file")"; then
    if [ "$actual" = "$shasum" ]; then
      ok "sha1 verified against the registry checksum"
      return 0
    fi
    err "npm checksum mismatch for $(basename "$file")"
    return 1
  fi

  warn "Could not verify the npm tarball — no usable hash tool"
  return 0
}

# --- downloads -------------------------------------------------------------

# Both helpers set BINARY_PATH and return 0, or return non-zero to let the
# caller try the next source. A checksum mismatch is not a "try the next
# source" case, so it exits outright.

download_from_github() {
  local version="$1" tmpdir="$2"
  local archive="${ALIAS_NAME}-${ASSET_SUFFIX}.tar.gz"
  local base="${GITHUB_RELEASES_URL}/download/v${version}"
  local sums="" expected=""

  info "Downloading ${BINARY_NAME} v${version} for ${PLATFORM_KEY} from GitHub Releases..."
  fetch "${base}/${archive}" -o "${tmpdir}/${archive}" 2>/dev/null || return 1

  sums="$(fetch "${base}/checksums.txt" 2>/dev/null)" || sums=""
  if [ -n "$sums" ]; then
    expected="$(printf '%s\n' "$sums" | awk -v want="$archive" '$2 == want || $2 == "*" want { print $1; exit }')"
  fi
  if [ -n "$expected" ]; then
    verify_sha256 "${tmpdir}/${archive}" "$expected" \
      || die "Refusing to install a download that does not match its published checksum"
    ok "sha256 verified against the published checksums"
  else
    warn "Release v${version} publishes no checksum for ${archive} — installing unverified"
  fi

  tar -xzf "${tmpdir}/${archive}" -C "$tmpdir" 2>/dev/null || return 1

  local extracted="${tmpdir}/${ALIAS_NAME}"
  [ "$DETECTED_OS" = "win32" ] && extracted="${extracted}.exe"
  [ -f "$extracted" ] || return 1

  BINARY_PATH="$extracted"
}

download_from_npm() {
  local version="$1" tmpdir="$2"
  local meta="" tarball="" integrity="" shasum=""

  info "Downloading ${BINARY_NAME} v${version} for ${PLATFORM_KEY} from the npm registry..."
  meta="$(fetch "${NPM_REGISTRY}/${NPM_PACKAGE}/${version}" 2>/dev/null)" || return 1

  tarball="$(json_value tarball "$meta")"
  [ -n "$tarball" ] || return 1
  case "$tarball" in
    https://*) ;;
    *) die "npm returned a non-HTTPS tarball URL: $tarball" ;;
  esac

  integrity="$(json_value integrity "$meta")"
  shasum="$(json_value shasum "$meta")"

  fetch "$tarball" -o "${tmpdir}/package.tgz" 2>/dev/null || return 1
  verify_npm_tarball "${tmpdir}/package.tgz" "$integrity" "$shasum" \
    || die "Refusing to install a download that does not match its published checksum"

  tar -xzf "${tmpdir}/package.tgz" -C "$tmpdir" 2>/dev/null || return 1

  local extracted="${tmpdir}/package/bin/${ALIAS_NAME}"
  [ "$DETECTED_OS" = "win32" ] && extracted="${extracted}.exe"
  [ -f "$extracted" ] || return 1

  BINARY_PATH="$extracted"
}

# --- installation ----------------------------------------------------------

prefix_help() {
  info "Install somewhere you own:"
  info "  curl -fsSL ${INSTALL_URL} | bash -s -- --prefix \"\$HOME/.local/bin\""
  info "Or install system-wide as root:"
  info "  curl -fsSL ${INSTALL_URL} | sudo bash -s -- --prefix /usr/local/bin"
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --version)
        [ $# -ge 2 ] || die "--version needs a value, e.g. --version 5.2.1"
        VERSION="$2"; shift 2 ;;
      --version=*)  VERSION="${1#*=}"; shift ;;
      --prefix|--to)
        [ $# -ge 2 ] || die "$1 needs a directory, e.g. $1 ~/.local/bin"
        PREFIX="$2"; shift 2 ;;
      --prefix=*|--to=*) PREFIX="${1#*=}"; shift ;;
      --dry-run) DRY_RUN=1; shift ;;
      --force)   FORCE=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) err "Unknown option: $1"; usage >&2; exit 1 ;;
    esac
  done

  if [ -n "$VERSION" ]; then
    VERSION="${VERSION#v}"
    is_version "$VERSION" || die "--version expects a version like 5.2.1, got: $VERSION"
  fi

  [ -n "$PREFIX" ] || PREFIX="${CPD_INSTALL_PREFIX:-${HOME}/.local/bin}"
  # A quoted --prefix '~/bin' never reaches the shell's tilde expansion.
  case "$PREFIX" in
    '~')   PREFIX="$HOME" ;;
    '~/'*) PREFIX="${HOME}/${PREFIX#\~/}" ;;
  esac
  PREFIX="${PREFIX%/}"
  [ -n "$PREFIX" ] || PREFIX="/"
}

main() {
  parse_args "$@"

  need_cmd curl
  need_cmd tar
  need_cmd uname

  detect_platform

  [ -n "$VERSION" ] || VERSION="$(get_latest_version)"

  local dest="${PREFIX}/${BINARY_NAME}"
  local alias_dest="${PREFIX}/${ALIAS_NAME}"
  if [ "$DETECTED_OS" = "win32" ]; then
    dest="${dest}.exe"
    alias_dest="${alias_dest}.exe"
  fi

  info "Installing ${BINARY_NAME} v${VERSION} for ${PLATFORM_KEY} to ${PREFIX}"

  if [ -n "$DRY_RUN" ]; then
    info "[dry-run] would download ${GITHUB_RELEASES_URL}/download/v${VERSION}/${ALIAS_NAME}-${ASSET_SUFFIX}.tar.gz"
    info "[dry-run] would install it as ${dest}"
    exit 0
  fi

  if [ -e "$dest" ] && [ -z "$FORCE" ]; then
    local existing=""
    existing="$("$dest" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sed -n '1p')" || existing=""
    if [ -z "$existing" ]; then
      warn "Something already exists at ${dest}"
      info "Use --force to overwrite it"
      exit 0
    fi
    if [ "$existing" = "$VERSION" ]; then
      ok "${BINARY_NAME} v${VERSION} is already installed at ${dest}"
      exit 0
    fi
    if version_gt "$VERSION" "$existing"; then
      info "Upgrading ${BINARY_NAME} v${existing} → v${VERSION}"
    else
      warn "${BINARY_NAME} v${existing} at ${dest} is newer than v${VERSION}"
      info "Use --force to downgrade, or pass a newer --version"
      exit 0
    fi
  fi

  # Fail on an unwritable target before spending a download on it.
  mkdir -p "$PREFIX" 2>/dev/null || { err "Cannot create ${PREFIX}"; prefix_help; exit 1; }
  [ -w "$PREFIX" ] || { err "No write permission for ${PREFIX}"; prefix_help; exit 1; }

  TMP_DIR="$(mktemp -d 2>/dev/null)" || die "Could not create a temporary directory"

  download_from_github "$VERSION" "$TMP_DIR" || {
    info "GitHub Releases download failed, trying the npm registry..."
    BINARY_PATH=""
    download_from_npm "$VERSION" "$TMP_DIR" || BINARY_PATH=""
  }

  if [ -z "$BINARY_PATH" ] || [ ! -f "$BINARY_PATH" ]; then
    err "Failed to download ${BINARY_NAME} v${VERSION} for ${PLATFORM_KEY}"
    err "Check that v${VERSION} exists: ${GITHUB_RELEASES_URL}"
    err "Or install from npm instead: npm install -g ${ALIAS_NAME}@5"
    exit 1
  fi

  # Stage next to the destination and rename over it: a half-written file is
  # never on PATH, and replacing a binary that is currently running works
  # (a plain copy fails with ETXTBSY).
  STAGED_FILE="${dest}.new.$$"
  rm -f "$STAGED_FILE"
  cp "$BINARY_PATH" "$STAGED_FILE"
  chmod 0755 "$STAGED_FILE"
  mv -f "$STAGED_FILE" "$dest"
  STAGED_FILE=""

  ok "${BINARY_NAME} v${VERSION} installed to ${dest}"

  if [ ! -e "$alias_dest" ] && [ ! -L "$alias_dest" ]; then
    if ln -sf "$dest" "$alias_dest" 2>/dev/null; then
      ok "Linked $(basename "$alias_dest") → $(basename "$dest")"
    elif cp "$dest" "$alias_dest" 2>/dev/null; then
      ok "Copied $(basename "$alias_dest") alongside $(basename "$dest")"
    fi
  fi

  case ":${PATH}:" in
    *":${PREFIX}:"*) ;;
    *)
      info "${PREFIX} is not on your PATH. Add it with:"
      info "  export PATH=\"${PREFIX}:\$PATH\""
      ;;
  esac
}

main "$@"
