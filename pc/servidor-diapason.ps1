# Diapasón — abre la aplicación en el navegador de este PC (http://localhost:8440)
# · Carpeta del profesor (Diapason-PC.zip): sirve la carpeta «app».
# · Carpeta del código fuente: compila con npm cuando hace falta y sirve «dist».
# Cerrar esta ventana detiene Diapasón.
param(
  [string]$Base = $PSScriptRoot,
  [string]$Root = '',
  [int]$Port = 8440
)

$ErrorActionPreference = 'Stop'
$url = "http://localhost:$Port/"

function Wait-AndExit([int]$code) {
  Write-Host ""
  Read-Host "  Pulsa Intro para cerrar" | Out-Null
  exit $code
}

function Get-Newest([string[]]$paths) {
  $newest = [datetime]::MinValue
  foreach ($p in $paths) {
    if (-not (Test-Path $p)) { continue }
    $items = if (Test-Path $p -PathType Container) { Get-ChildItem $p -Recurse -File } else { Get-Item $p }
    foreach ($i in $items) { if ($i.LastWriteTime -gt $newest) { $newest = $i.LastWriteTime } }
  }
  return $newest
}

$Base = (Resolve-Path $Base).Path

if (-not $Root) {
  if (Test-Path (Join-Path $Base 'app\index.html')) {
    $Root = Join-Path $Base 'app'
  } elseif (Test-Path (Join-Path $Base 'package.json')) {
    # Carpeta del código fuente: compilar si no hay versión compilada o si el código es más nuevo
    $dist = Join-Path $Base 'dist'
    $distIndex = Join-Path $dist 'index.html'
    $sources = @('src', 'public', 'index.html', 'package.json', 'vite.config.js', 'tailwind.config.js') | ForEach-Object { Join-Path $Base $_ }
    $needBuild = -not (Test-Path $distIndex)
    if (-not $needBuild) { $needBuild = (Get-Newest $sources) -gt (Get-Item $distIndex).LastWriteTime }

    if ($needBuild) {
      $npm = if ($env:OS -eq 'Windows_NT') { 'npm.cmd' } else { 'npm' }
      if (-not (Get-Command $npm -ErrorAction SilentlyContinue)) {
        Write-Host ""
        Write-Host "  Para compilar Diapasón hace falta Node.js (https://nodejs.org)." -ForegroundColor Yellow
        Write-Host "  Instálalo y vuelve a hacer doble clic en «Abrir en el PC.bat»."
        Wait-AndExit 1
      }
      Push-Location $Base
      try {
        if (-not (Test-Path (Join-Path $Base 'node_modules'))) {
          Write-Host ""
          Write-Host "  Instalando dependencias (solo la primera vez)..." -ForegroundColor Cyan
          & $npm install --no-audit --no-fund
          if ($LASTEXITCODE -ne 0) { Write-Host "  Error en npm install." -ForegroundColor Red; Wait-AndExit 1 }
        }
        Write-Host ""
        Write-Host "  Compilando Diapasón..." -ForegroundColor Cyan
        & $npm run build
        if ($LASTEXITCODE -ne 0) { Write-Host "  Error al compilar." -ForegroundColor Red; Wait-AndExit 1 }
      } finally {
        Pop-Location
      }
    }
    $Root = $dist
  } else {
    Write-Host "  No se encuentra la aplicación junto a este archivo." -ForegroundColor Red
    Wait-AndExit 1
  }
}

$Root = (Resolve-Path $Root).Path

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.webmanifest' = 'application/manifest+json'; '.svg' = 'image/svg+xml'
  '.png' = 'image/png'; '.ico' = 'image/x-icon'; '.woff2' = 'font/woff2'; '.txt' = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
try {
  $listener.Start()
} catch {
  # El puerto ya está en uso: lo más probable es que Diapasón ya esté abierto
  Write-Host ""
  Write-Host "  Diapasón ya está en marcha. Abriendo el navegador..." -ForegroundColor Yellow
  try { Start-Process $url } catch { Write-Host "  Abre $url en tu navegador." }
  Start-Sleep -Seconds 2
  exit 0
}

$Host.UI.RawUI.WindowTitle = 'Diapasón'
Write-Host ""
Write-Host "  Diapasón está abierto en tu navegador: $url" -ForegroundColor Green
Write-Host "     Tus datos se guardan en este navegador, en este PC."
Write-Host "     Deja esta ventana abierta mientras uses Diapasón. Para terminar, ciérrala."
Write-Host ""
try { Start-Process $url } catch { Write-Host "  Abre $url en tu navegador (Edge o Chrome)." -ForegroundColor Yellow }

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
    $file = [System.IO.Path]::GetFullPath((Join-Path $Root $path))
    if (-not $file.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $file -PathType Leaf)) {
      $file = Join-Path $Root 'index.html'
    }
    $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
    $type = $mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentType = $type
    $ctx.Response.Headers.Add('Cache-Control', 'no-cache')
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.OutputStream.Close()
  } catch {
    try { $ctx.Response.StatusCode = 500; $ctx.Response.Close() } catch {}
  }
}
