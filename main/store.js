'use strict';
const fs = require('fs');
const path = require('path');

/** Tiny JSON settings store (userData/mars.json). Never throws. */
function createStore(dir) {
  const file = path.join(dir, 'mars.json');
  let data = {};
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { data = {}; }
  const save = () => { try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch { /* ignore */ } };
  return {
    get: () => ({ ...data }),
    set(patch) { data = { ...data, ...patch }; save(); return { ...data }; },
  };
}

/** Minimal .env reader (KEY=value lines). No dependency. */
function readEnv(...files) {
  const env = {};
  for (const f of files) {
    try {
      for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
        if (line.trim().startsWith('#')) continue;
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    } catch { /* missing file is fine */ }
  }
  return env;
}

module.exports = { createStore, readEnv };
