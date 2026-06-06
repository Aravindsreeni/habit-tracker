// sync-web.mjs — copy the canonical web app (repo root) into ./www, which is
// Capacitor's `webDir`. The root stays the single source of truth (and the
// GitHub Pages site); this just mirrors the shippable assets into the native
// project before `cap sync` / `cap add`. Pure Node, no dependencies.
import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url)); // native/scripts
const root = resolve(here, '..', '..');               // repo root (web app)
const www  = resolve(here, '..', 'www');              // native/www  (webDir)

// The app shell — everything the PWA serves, minus docs and the native project.
const ASSETS = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons'];

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

let copied = 0;
for (const name of ASSETS) {
  const src = join(root, name);
  if (!existsSync(src)) { console.warn(`  skip (missing): ${name}`); continue; }
  cpSync(src, join(www, name), { recursive: true });
  console.log(`  copied ${name}`);
  copied++;
}

console.log(`\nSynced ${copied} asset${copied === 1 ? '' : 's'} → ${www}`);
