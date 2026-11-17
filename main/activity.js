'use strict';
/* Watches which app is in the foreground so Mars can copy what the user is doing.
 * One persistent PowerShell process prints "<processname>|<fullscreen 0/1>|<media playing 0/1>" every 2.5 s.
 * Only the process name and two flags leave that process: no window titles, no song or video titles, no keystrokes.
 * "Media playing" comes from Windows' media controls (the source of the volume flyout); only the playback status is read. */
const { spawn } = require('child_process');

const SCRIPT = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -ReferencedAssemblies System.Windows.Forms,System.Drawing -TypeDefinition @"
using System; using System.Runtime.InteropServices; using System.Drawing; using System.Windows.Forms;
public class MarsFg {
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  public static string Info() {
    IntPtr h = GetForegroundWindow(); if (h == IntPtr.Zero) return "0|0";
    uint pid; GetWindowThreadProcessId(h, out pid);
    RECT r; GetWindowRect(h, out r);
    Rectangle b = Screen.FromHandle(h).Bounds;
    bool full = r.L <= b.Left + 2 && r.T <= b.Top + 2 && r.R >= b.Right - 2 && r.B >= b.Bottom - 2;
    return pid + "|" + (full ? "1" : "0");
  }
}
"@
# Media sessions (Windows media controls). Any failure just means "no media" (flag 0).
$media = $null
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' })[0]
  $T = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
  $task = $asTask.MakeGenericMethod($T).Invoke($null, @($T::RequestAsync()))
  if ($task.Wait(5000)) { $media = $task.Result }
} catch { $media = $null }
while ($true) {
  $i = ([MarsFg]::Info()).Split('|')
  $n = ''
  if ($i[0] -ne '0') { $n = (Get-Process -Id ([int]$i[0])).ProcessName }
  $p = '0'
  if ($media) { try { foreach ($s in $media.GetSessions()) { if ([int]$s.GetPlaybackInfo().PlaybackStatus -eq 4) { $p = '1' } } } catch { } }
  [Console]::Out.WriteLine("$n|$($i[1])|$p")
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 2500
}
`;

/** onSample({name, full, media}) is called for every sample. Returns {stop()}. Never throws. */
function startActivityWatcher(onSample) {
  let child = null, buf = '', stopped = false;
  try {
    const encoded = Buffer.from(SCRIPT, 'utf16le').toString('base64');
    child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (d) => {
      buf += d;
      let k;
      while ((k = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, k).trim(); buf = buf.slice(k + 1);
        const m = line.match(/^([^|]*)\|([01])(?:\|([01]))?$/);
        if (m) onSample({ name: m[1], full: m[2] === '1', media: m[3] === '1' });
      }
    });
    child.on('error', () => { child = null; });
    child.on('exit', () => { child = null; });
  } catch { child = null; }
  return { stop() { stopped = true; try { if (child) child.kill(); } catch { /* ignore */ } }, get running() { return !!child && !stopped; } };
}

module.exports = { startActivityWatcher };
