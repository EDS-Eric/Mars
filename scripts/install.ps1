$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "Installing Mars..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed. Get it from https://nodejs.org/ (version 20 or newer), then run this again."
}
$major = [int]((node -v).TrimStart('v').Split('.')[0])
if ($major -lt 20) { throw "Node.js 20 or newer is required (found $(node -v))." }

npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Created .env - add your ANTHROPIC_API_KEY there if you want Mars to chat with an AI brain (optional)." -ForegroundColor Yellow
}

Write-Host "Starting Mars. Mars is registered to start with Windows (turn it off from the tray icon)." -ForegroundColor Green
Start-Process -FilePath (Join-Path $PWD "node_modules\electron\dist\electron.exe") -ArgumentList "`"$PWD`""
