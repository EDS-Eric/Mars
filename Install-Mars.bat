@echo off
setlocal
title Install Mars
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1" %*
if errorlevel 1 (
  echo.
  echo The installer stopped. See the message above.
)
pause
