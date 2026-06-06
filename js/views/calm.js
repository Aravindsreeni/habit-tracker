// ── calm.js — Calm destination: Grove header wrapper for mindfulness.js ──
// mindfulness.js uses a `built` flag + running timers that must not be wiped
// by re-renders. This wrapper creates #p-mindfulness once and never recreates
// it, so breathing / meditation sessions survive destination switches.
import { render as rMindful } from './mindfulness.js';

export function render() {
  const el = document.getElementById('p-calm');
  if (!el) return;

  // Guard: if the inner panel already exists, just delegate (built flag keeps
  // the timer session alive; rMindful() becomes a no-op while running).
  if (el.querySelector('#p-mindfulness')) { rMindful(); return; }

  el.innerHTML = `<div class="scr-head">
    <div class="scr-eyebrow">Calm</div>
    <div class="scr-greet">Your <em>quiet moment</em></div>
  </div>
  <div id="p-mindfulness"></div>`;

  rMindful();
}
