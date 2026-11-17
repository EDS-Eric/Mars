@echo off
setlocal
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo [Mars] Not installed yet. Run Install-Mars.bat first.
  pause
  exit /b 1
)
REM Start without a console window; Mars lives in the tray.
start "" "node_modules\electron\dist\electron.exe" "%~dp0."
exit /b 0
