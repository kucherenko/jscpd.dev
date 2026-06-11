#!/usr/bin/env bash
# jscpd / cpd install script
# Usage: curl -fsSL https://jscpd.dev/install | bash
#        curl -fsSL https://jscpd.dev/install | bash -s -- --version 5.0.7
#        curl -fsSL https://jscpd.dev/install | bash -s -- --prefix ~/bin
#
# Downloads the cpd binary for the current platform and installs it.
# Primary source: GitHub Releases (kucherenko/jscpd)
# Fallback: npm registry tarballs
#
# Options:
#   --version VERSION   Install a specific version (default: latest)
#   --prefix DIR        Installation directory (default: /usr/local/bin)
#   --to DIR            Alias for --prefix
#   --dry-run           Show what would be done without installing
#   --force             Overwrite existing binary
#   -h, --help          Show this help

set -euo pipefail

REPO="kucherenko/jscpd"
BINARY_NAME="cpd"
GITHUB_RELEASES_URL="https://github.com/${REPO}/releases"
NPM_REGISTRY="https://registry.npmjs.org"

VERSION=""
PREFIX=""
DRY_RUN=""
FORCE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --version) shift; VERSION="${1:-}"; shift ;;
    --prefix|--to) shift; PREFIX="${1:-}"; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help)
      echo "Usage: curl -fsSL https://jscpd.dev/install | bash"
      echo "       curl -fsSL https://jscpd.dev/install | bash -s -- --version 5.0.7"
      echo "       curl -fsSL https://jscpd.dev/install | bash -s -- --prefix ~/bin"
      echo ""
      echo "Options:"
      echo "  --version VERSION   Install a specific version (default: latest)"
      echo "  --prefix DIR        Installation directory (default: /usr/local/bin)"
      echo "  --to DIR            Alias for --prefix"
      echo "  --dry-run           Show what would be done without installing"
      echo "  --force             Overwrite existing binary"
      echo "  -h, --help          Show this help"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ -z "$PREFIX" ]; then
  PREFIX="${CPD_INSTALL_PREFIX:-${HOME}/.local/bin}"
fi

info()  { printf '\033[1;34m→\033[0m %s\n' "$*" >&2; }
ok()    { printf '\033[1;32m✓\033[0m %s\n' "$*" >&2; }
warn()  { printf '\033[1;33m!\033[0m %s\n' "$*" >&2; }
err()   { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; }

detect_platform() {
  DETECTED_OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
  DETECTED_CPU="$(uname -m)"

  case "$DETECTED_OS" in
    darwin) DETECTED_OS="darwin" ;;
    linux)  DETECTED_OS="linux" ;;
    mingw*|msys*|cygwin*) DETECTED_OS="win32" ;;
    *) err "Unsupported OS: $DETECTED_OS"; exit 1 ;;
  esac

  case "$DETECTED_CPU" in
    x86_64|amd64)  DETECTED_CPU="x64" ;;
    aarch64|arm64) DETECTED_CPU="arm64" ;;
    *) err "Unsupported architecture: $DETECTED_CPU"; exit 1 ;;
  esac

  local libc=""
  if [ "$DETECTED_OS" = "linux" ]; then
    libc="glibc"
    if ldd --version 2>&1 | grep -qi musl; then
      libc="musl"
    fi
  fi

  PLATFORM_KEY="${DETECTED_OS}-${DETECTED_CPU}"
  if [ "$DETECTED_OS" = "linux" ] && [ "$libc" = "musl" ]; then
    PLATFORM_KEY="${DETECTED_OS}-${DETECTED_CPU}-musl"
  elif [ "$DETECTED_OS" = "linux" ]; then
    PLATFORM_KEY="${DETECTED_OS}-${DETECTED_CPU}-gnu"
  fi

  NPM_PACKAGE="cpd-${PLATFORM_KEY}"

  case "$PLATFORM_KEY" in
    linux-x64-gnu)    GITHUB_ASSET_SUFFIX="linux-x64-gnu" ;;
    linux-arm64-gnu)  GITHUB_ASSET_SUFFIX="linux-arm64-gnu" ;;
    linux-x64-musl)   GITHUB_ASSET_SUFFIX="linux-x64-musl" ;;
    darwin-arm64)      GITHUB_ASSET_SUFFIX="darwin-arm64" ;;
    darwin-x64)        GITHUB_ASSET_SUFFIX="darwin-x64" ;;
    win32-x64)         GITHUB_ASSET_SUFFIX="windows-x64-msvc" ;;
    *) err "No binary available for platform: $PLATFORM_KEY"; exit 1 ;;
  esac
}

get_latest_version() {
  local url="${GITHUB_RELEASES_URL}/latest"
  local version

  version=$(curl -fsSL -o /dev/null -w '%{url_effective}' "$url" 2>/dev/null \
    | sed 's|.*/tag/||' \
    | sed 's/^v//') || true

  if [ -z "$version" ]; then
    version=$(curl -fsSL "https://registry.npmjs.org/cpd/latest" 2>/dev/null \
      | grep -o '"version":"[^"]*"' \
      | head -1 \
      | sed 's/"version":"//;s/"//') || true
  fi

  if [ -z "$version" ]; then
    err "Could not determine latest version"
    exit 1
  fi

  echo "$version"
}

download_from_github() {
  local version="$1"
  local tmpdir="$2"
  local archive_name="cpd-${GITHUB_ASSET_SUFFIX}.tar.gz"
  local url="${GITHUB_RELEASES_URL}/download/v${version}/${archive_name}"

  info "Downloading cpd v${version} for ${PLATFORM_KEY} from GitHub Releases..."

  if ! curl -fsSL "$url" -o "${tmpdir}/${archive_name}" 2>/dev/null; then
    return 1
  fi

  tar -xzf "${tmpdir}/${archive_name}" -C "$tmpdir" 2>/dev/null || return 1

  local bin_name="$BINARY_NAME"
  if [ "$DETECTED_OS" = "win32" ]; then
    bin_name="${BINARY_NAME}.exe"
  fi

  if [ -f "${tmpdir}/${bin_name}" ]; then
    echo "${tmpdir}/${bin_name}"
    return 0
  fi

  return 1
}

download_from_npm() {
  local version="$1"
  local tmpdir="$2"
  local url="${NPM_REGISTRY}/${NPM_PACKAGE}/${version}"
  local tarball_url

  info "Downloading cpd v${version} for ${PLATFORM_KEY} from npm registry..."

  tarball_url=$(curl -fsSL "$url" 2>/dev/null \
    | grep -o '"tarball":"[^"]*"' \
    | head -1 \
    | sed 's/"tarball":"//;s/"//')

  if [ -z "$tarball_url" ]; then
    return 1
  fi

  if ! curl -fsSL "$tarball_url" -o "${tmpdir}/package.tgz" 2>/dev/null; then
    return 1
  fi

  tar -xzf "${tmpdir}/package.tgz" -C "$tmpdir" 2>/dev/null || return 1

  local bin_name="$BINARY_NAME"
  if [ "$DETECTED_OS" = "win32" ]; then
    bin_name="${BINARY_NAME}.exe"
  fi

  if [ -f "${tmpdir}/package/cpd-bin/${bin_name}" ]; then
    echo "${tmpdir}/package/cpd-bin/${bin_name}"
    return 0
  fi

  return 1
}

main() {
  detect_platform

  if [ -z "$VERSION" ]; then
    VERSION="$(get_latest_version)"
  fi

  info "Installing cpd v${VERSION} for ${PLATFORM_KEY} to ${PREFIX}"

  if [ -n "$DRY_RUN" ]; then
    info "[dry-run] Would install cpd v${VERSION} for ${PLATFORM_KEY} to ${PREFIX}"
    exit 0
  fi

  if [ -f "${PREFIX}/${BINARY_NAME}" ] && [ -z "$FORCE" ]; then
    existing_version=""
    existing_version=$("${PREFIX}/${BINARY_NAME}" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
    if [ -n "$existing_version" ]; then
      warn "cpd v${existing_version} already installed at ${PREFIX}/${BINARY_NAME}"
      info "Use --force to overwrite, or remove it first"
    else
      warn "An existing file exists at ${PREFIX}/${BINARY_NAME}"
      info "Use --force to overwrite"
    fi
    exit 0
  fi

  local tmpdir
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "${tmpdir:-}"' EXIT

  local binary_path=""

  binary_path=$(download_from_github "$VERSION" "$tmpdir") || binary_path=""

  if [ -z "$binary_path" ]; then
    info "GitHub Releases download failed, trying npm registry..."
    binary_path=$(download_from_npm "$VERSION" "$tmpdir") || binary_path=""
  fi

  if [ -z "$binary_path" ] || [ ! -f "$binary_path" ]; then
    err "Failed to download cpd v${VERSION} for ${PLATFORM_KEY}"
    err "Try installing via npm instead: npm install -g jscpd@5"
    exit 1
  fi

  mkdir -p "$PREFIX" 2>/dev/null || {
    err "Cannot write to ${PREFIX} — try: sudo env \"PATH=\$PATH\" bash $(ps -p $$ -o args= | head -1)"
    err "Or install to a user directory: --prefix ~/.local/bin"
    exit 1
  }

  local dest="${PREFIX}/${BINARY_NAME}"
  if [ "$DETECTED_OS" = "win32" ]; then
    dest="${dest}.exe"
  fi

  cp "$binary_path" "$dest"
  chmod +x "$dest" 2>/dev/null || true

  ok "cpd v${VERSION} installed to ${dest}"

  if [ -f "${PREFIX}/jscpd" ] || [ -L "${PREFIX}/jscpd" ]; then
    :
  else
    ln -sf "$dest" "${PREFIX}/jscpd" 2>/dev/null && ok "Symlinked jscpd -> cpd" || true
  fi

  local installed_version=""
  installed_version=$("$dest" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
  if [ -n "$installed_version" ]; then
    ok "Verified: cpd v${installed_version}"
  else
    warn "Could not verify installed version (binary may need PATH refresh)"
  fi

  info "Add ${PREFIX} to your PATH if not already there:"
  info "  export PATH=\"${PREFIX}:\$PATH\""
}

main