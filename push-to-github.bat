@echo off
REM ============================================================
REM  Mars - push this folder to GitHub (Windows). ONE-TIME script.
REM
REM  The gh CLI is not installed, so the repository cannot be created from here.
REM
REM  BEFORE running this:
REM   1. On github.com create an EMPTY repository named Mars (no README,
REM      no .gitignore, no licence - this repo already has them).
REM   2. Replace OWNER below with your GitHub user or organisation name.
REM   3. Be signed in to GitHub in Git (the first push opens a browser prompt).
REM ============================================================
set "REMOTE=https://github.com/EDS-Eric/Mars.git"

cd /d "%~dp0"
git branch -M main
git remote remove origin 2>nul
git remote add origin %REMOTE%
git push -u origin main

echo.
echo Done. If there were no red errors above, your code is at %REMOTE%
pause
