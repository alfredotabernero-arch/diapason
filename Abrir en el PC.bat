@echo off
rem Diapason - abre la aplicacion en el navegador de este PC (doble clic).
rem Si es la carpeta del codigo fuente, compila automaticamente cuando hace falta.
setlocal
cd /d "%~dp0"
set "PS1=%~dp0servidor-diapason.ps1"
if not exist "%PS1%" set "PS1=%~dp0pc\servidor-diapason.ps1"
if not exist "%PS1%" (
  echo No se encuentra servidor-diapason.ps1
  pause
  exit /b 1
)
title Diapason
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" -Base "%~dp0." -Port 8440
endlocal
