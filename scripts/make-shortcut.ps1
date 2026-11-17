# Creates assets/icon.ico (the 256 px icon.png in an ICO container) and a "Mars" shortcut on the desktop.
# Starts Mars directly, no console window. Run: powershell -ExecutionPolicy Bypass -File scripts\make-shortcut.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$png = Join-Path $root 'assets\icon.png'
$ico = Join-Path $root 'assets\icon.ico'
$exe = Join-Path $root 'node_modules\electron\dist\electron.exe'
if (-not (Test-Path $exe)) { throw "electron.exe not found - run npm install first." }

$bytes = [IO.File]::ReadAllBytes($png)
$ms = New-Object IO.MemoryStream
$w = New-Object IO.BinaryWriter($ms)
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]1)          # ICONDIR: 1 image
$w.Write([byte]0); $w.Write([byte]0); $w.Write([byte]0); $w.Write([byte]0)  # 256x256 (0 = 256), no palette
$w.Write([uint16]1); $w.Write([uint16]32)                              # planes, bpp
$w.Write([uint32]$bytes.Length); $w.Write([uint32]22)                  # size, offset
$w.Write($bytes); $w.Flush()
[IO.File]::WriteAllBytes($ico, $ms.ToArray())

$desktop = [Environment]::GetFolderPath('Desktop')
$s = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desktop 'Mars.lnk'))
$s.TargetPath = $exe
$s.Arguments = "`"$root`""
$s.WorkingDirectory = $root
$s.IconLocation = "$ico,0"
$s.Description = 'Mars, the cobberdog on your desktop'
$s.Save()
Write-Host "Shortcut created: $(Join-Path $desktop 'Mars.lnk')" -ForegroundColor Green
