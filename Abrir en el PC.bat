@echo off
rem Diapason - doble clic para abrirlo en el navegador de este PC (sin Internet).
rem En la carpeta del codigo fuente, compila Diapason.html si falta o si has cambiado el codigo.
setlocal
cd /d "%~dp0"
if exist "%~dp0package.json" if exist "%~dp0pc\compilar-si-hace-falta.ps1" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pc\compilar-si-hace-falta.ps1" -Base "%~dp0."
  if errorlevel 1 exit /b 1
)
if not exist "%~dp0Diapason.html" (
  echo.
  echo  No se encuentra Diapason.html junto a este archivo.
  echo.
  pause
  exit /b 1
)
start "" "%~dp0Diapason.html"
endlocal
