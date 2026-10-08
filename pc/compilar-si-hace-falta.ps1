# Diapasón — compila «Diapason.html» desde el código fuente cuando hace falta.
# Lo llama «Abrir en el PC.bat». Solo actúa en la carpeta del código (la que tiene package.json).
param([string]$Base = (Split-Path $PSScriptRoot -Parent))

$ErrorActionPreference = 'Stop'
$Base = (Resolve-Path $Base).Path
$html = Join-Path $Base 'Diapason.html'

function Get-Newest([string[]]$paths) {
  $newest = [datetime]::MinValue
  foreach ($p in $paths) {
    if (-not (Test-Path $p)) { continue }
    $items = if (Test-Path $p -PathType Container) { Get-ChildItem $p -Recurse -File } else { Get-Item $p }
    foreach ($i in $items) { if ($i.LastWriteTime -gt $newest) { $newest = $i.LastWriteTime } }
  }
  return $newest
}

$sources = @('src', 'public', 'index.html', 'package.json', 'vite.config.js', 'tailwind.config.js') | ForEach-Object { Join-Path $Base $_ }
$needBuild = -not (Test-Path $html)
if (-not $needBuild) { $needBuild = (Get-Newest $sources) -gt (Get-Item $html).LastWriteTime }
if (-not $needBuild) { exit 0 }

$npm = if ($env:OS -eq 'Windows_NT') { 'npm.cmd' } else { 'npm' }
if (-not (Get-Command $npm -ErrorAction SilentlyContinue)) {
  if (Test-Path $html) { exit 0 }   # sin Node.js: se abre la versión que haya
  Write-Host ""
  Write-Host "  Para compilar Diapasón hace falta Node.js (https://nodejs.org)." -ForegroundColor Yellow
  Write-Host "  También puedes descargar Diapason-PC.zip desde Releases en GitHub, que ya va compilado."
  Read-Host "  Pulsa Intro para cerrar" | Out-Null
  exit 1
}

Push-Location $Base
try {
  if (-not (Test-Path (Join-Path $Base 'node_modules'))) {
    Write-Host "  Instalando dependencias (solo la primera vez)..." -ForegroundColor Cyan
    & $npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm install' }
  }
  Write-Host "  Compilando Diapasón..." -ForegroundColor Cyan
  & $npm run build:pc
  if ($LASTEXITCODE -ne 0) { throw 'npm run build:pc' }
} catch {
  Write-Host "  Error al compilar ($_)." -ForegroundColor Red
  Read-Host "  Pulsa Intro para cerrar" | Out-Null
  exit 1
} finally {
  Pop-Location
}
exit 0
