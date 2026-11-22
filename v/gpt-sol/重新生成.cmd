@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 18 or newer to rebuild. Opening index.html does not need Node.js.
  pause
  exit /b 1
)
node work\build.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
copy /y outputs\index.html index.html >nul
echo Rebuilt index.html. Double-click launcher.cmd to open it.
pause