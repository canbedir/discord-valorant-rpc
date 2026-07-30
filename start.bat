@echo off
chcp 65001 >nul
title discord-valorant-rpc
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :no_node

node src/index.mjs %*
echo.
echo Stopped.
pause
exit /b 0

:no_node
echo.
echo   Node.js is required but was not found.
echo.
where winget >nul 2>nul
if errorlevel 1 (
  echo   Install it from https://nodejs.org and run this again.
  echo.
  pause
  exit /b 1
)
echo   It can be installed now with winget.
echo.
choice /c YN /m "  Install Node.js LTS"
if errorlevel 2 (
  echo   Cancelled. Install it from https://nodejs.org and run this again.
  pause
  exit /b 1
)
winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
echo.
echo   Close this window and run start.bat again so the new PATH is picked up.
pause
exit /b 0
