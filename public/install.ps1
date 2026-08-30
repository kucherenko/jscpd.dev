#!/usr/bin/env pwsh
<#
.SYNOPSIS
  jscpd / cpd install script for Windows (PowerShell).

.DESCRIPTION
  Downloads the jscpd binary for this machine and installs it. The bash
  installer (install.sh) needs a POSIX shell, so on Windows it either fails or
  — when `bash` resolves to WSL — installs the *Linux* binary inside the WSL
  filesystem rather than under the Windows user profile. This script installs a
  native Windows executable with no Node.js, Git Bash, or WSL involved.

  Primary source: GitHub Releases (kucherenko/jscpd)
  Fallback:       npm registry tarballs

.EXAMPLE
  irm https://jscpd.dev/install.ps1 | iex

.EXAMPLE
  &([scriptblock]::Create((irm https://jscpd.dev/install.ps1))) -Version 5.1.0 -Prefix C:\tools
#>
[CmdletBinding()]
param(
  [string]$Version = '',
  [string]$Prefix = '',
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'  # keeps Invoke-WebRequest fast

$Repo = 'kucherenko/jscpd'

function Write-Info { param($m) Write-Host "-> $m" -ForegroundColor Blue }
function Write-Ok   { param($m) Write-Host "OK $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "!  $m" -ForegroundColor Yellow }

function Get-Architecture {
  # PROCESSOR_ARCHITECTURE reports the *process* architecture: a 32-bit or
  # emulated x64 shell on an ARM64 machine reports AMD64/x86 and puts the real
  # machine architecture in PROCESSOR_ARCHITEW6432.
  $arch = $env:PROCESSOR_ARCHITEW6432
  if (-not $arch) { $arch = $env:PROCESSOR_ARCHITECTURE }

  switch ($arch.ToUpperInvariant()) {
    'AMD64' { return 'x64' }
    'ARM64' { return 'arm64' }
    'X86'   { return 'x64' }   # 32-bit shell on a 64-bit OS
    default { throw "Unsupported architecture: $arch" }
  }
}

function Get-LatestVersion {
  # GitHub API first (authoritative for releases); the npm registry is a
  # rate-limit-free fallback. `cpd` is published only from the v5 line, so its
  # latest tag always matches the newest release.
  try {
    $rel = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" `
      -Headers @{ 'User-Agent' = 'jscpd-install' } -UseBasicParsing
    if ($rel.tag_name) { return ($rel.tag_name -replace '^v', '') }
  } catch {
    Write-Warn "GitHub API unavailable ($($_.Exception.Message)); falling back to the npm registry"
  }

  $pkg = Invoke-RestMethod -Uri 'https://registry.npmjs.org/cpd/latest' -UseBasicParsing
  if (-not $pkg.version) { throw 'Could not determine the latest version' }
  return $pkg.version
}

function Expand-Tarball {
  param([string]$Archive, [string]$Destination)
  # tar.exe ships with Windows 10 1803+ and Server 2019+.
  $tar = Get-Command tar.exe -ErrorAction SilentlyContinue
  if (-not $tar) {
    throw "tar.exe not found. It ships with Windows 10 1803 and later; on older builds install jscpd with: npm install -g jscpd@5"
  }
  & $tar.Source -xzf $Archive -C $Destination
  if ($LASTEXITCODE -ne 0) { throw "Failed to extract $Archive" }
}

function Get-BinaryFromGitHub {
  param([string]$Ver, [string]$Arch, [string]$TmpDir)
  $asset = "jscpd-windows-$Arch-msvc.tar.gz"
  $url = "https://github.com/$Repo/releases/download/v$Ver/$asset"
  $archive = Join-Path $TmpDir $asset

  Write-Info "Downloading jscpd v$Ver for windows-$Arch from GitHub Releases..."
  Invoke-WebRequest -Uri $url -OutFile $archive -UseBasicParsing
  Expand-Tarball -Archive $archive -Destination $TmpDir

  $exe = Join-Path $TmpDir 'jscpd.exe'
  if (Test-Path $exe) { return $exe }
  return $null
}

function Get-BinaryFromNpm {
  param([string]$Ver, [string]$Arch, [string]$TmpDir)
  $pkgName = "jscpd-windows-$Arch-msvc"
  Write-Info "Downloading jscpd v$Ver for windows-$Arch from the npm registry..."

  $meta = Invoke-RestMethod -Uri "https://registry.npmjs.org/$pkgName/$Ver" -UseBasicParsing
  if (-not $meta.dist.tarball) { return $null }

  $archive = Join-Path $TmpDir 'package.tgz'
  Invoke-WebRequest -Uri $meta.dist.tarball -OutFile $archive -UseBasicParsing
  Expand-Tarball -Archive $archive -Destination $TmpDir

  foreach ($candidate in @('package\bin\jscpd.exe', 'package\jscpd.exe')) {
    $exe = Join-Path $TmpDir $candidate
    if (Test-Path $exe) { return $exe }
  }
  return $null
}

# ── main ────────────────────────────────────────────────────────────────────

if (-not $Prefix) {
  # Plain if/else, not `$x = if (...) {...}` with `else` on the next line:
  # Windows PowerShell 5.1 ends the statement at the newline there and every
  # brace after it misparses.
  if ($env:CPD_INSTALL_PREFIX) {
    $Prefix = $env:CPD_INSTALL_PREFIX
  } else {
    $Prefix = Join-Path $env:USERPROFILE '.local\bin'
  }
}

$arch = Get-Architecture
if (-not $Version) { $Version = Get-LatestVersion }

$dest = Join-Path $Prefix 'jscpd.exe'

if ($DryRun) {
  Write-Info "[dry-run] Would install jscpd v$Version (windows-$arch) to $dest"
  exit 0
}

if ((Test-Path $dest) -and -not $Force) {
  $existing = ''
  try { $existing = (& $dest --version 2>$null | Select-String -Pattern '\d+\.\d+\.\d+').Matches.Value } catch { }
  if ($existing -eq $Version) {
    Write-Ok "jscpd v$Version is already installed at $dest"
    exit 0
  }
  if ($existing) {
    Write-Info "Replacing jscpd v$existing with v$Version"
  } else {
    Write-Warn "A file already exists at $dest — re-run with -Force to overwrite"
    exit 1
  }
}

$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("jscpd-install-" + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

try {
  $binary = $null
  try {
    $binary = Get-BinaryFromGitHub -Ver $Version -Arch $arch -TmpDir $tmpDir
  } catch {
    Write-Warn "GitHub Releases download failed: $($_.Exception.Message)"
  }

  if (-not $binary) {
    try {
      $binary = Get-BinaryFromNpm -Ver $Version -Arch $arch -TmpDir $tmpDir
    } catch {
      Write-Warn "npm registry download failed: $($_.Exception.Message)"
    }
  }

  if (-not $binary) {
    throw "Could not download jscpd v$Version for windows-$arch. Install it with npm instead: npm install -g jscpd@5"
  }

  New-Item -ItemType Directory -Path $Prefix -Force | Out-Null
  Copy-Item -Path $binary -Destination $dest -Force
  # `cpd` is the short alias the Unix installer also provides.
  Copy-Item -Path $binary -Destination (Join-Path $Prefix 'cpd.exe') -Force

  $installed = ''
  try { $installed = (& $dest --version 2>$null | Select-String -Pattern '\d+\.\d+\.\d+').Matches.Value } catch { }
  if ($installed) {
    Write-Ok "jscpd v$installed installed to $dest"
  } else {
    Write-Ok "jscpd installed to $dest"
    Write-Warn 'Could not run the binary to verify its version'
  }

  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  if ($userPath -and ($userPath -split ';' | Where-Object { $_.TrimEnd('\') -ieq $Prefix.TrimEnd('\') })) {
    Write-Info "$Prefix is already on your PATH"
  } else {
    Write-Info "Add $Prefix to your PATH:"
    # -f keeps the prefix out of a string already dense with quotes.
    $hint = "  [Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User') + ';{0}', 'User')" -f $Prefix
    Write-Host $hint -ForegroundColor Cyan
    Write-Info 'Then open a new terminal.'
  }
} finally {
  Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
}
