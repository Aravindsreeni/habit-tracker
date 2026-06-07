// ── calm.js — Calm destination: Grove header wrapper for mindfulness.js ──
// mindfulness.js uses a `built` flag + running timers that must not be wiped
// by re-renders. This wrapper creates #p-mindfulness once and never recreates
// it, so breathing / meditation sessions survive destination switches.
import { render as rMindful, resetBuilt } from './mindfulness.js';
import { t } from '../i18n.js';

export function render() {
  const el = document.getElementById('p-calm');
  if (!el) return;

  // Guard: if the inner panel already exists, update header text in-place
  // (avoids wiping the mindfulness panel and destroying a running session)
  // then let rMindful rebuild if the language changed (resetBuilt was called).
  if (el.querySelector('#p-mindfulness')) {
    const eyebrow = el.querySelector('.scr-eyebrow');
    const greet   = el.querySelector('.scr-greet');
    if (eyebrow) eyebrow.textContent = t('calm.title');
    if (greet)   greet.innerHTML = `Your <em>${t('calm.subtitle')}</em>`;
    rMindful();
    return;
  }

  el.innerHTML = `<div class="scr-head">
    <div class="scr-eyebrow">${t('calm.title')}</div>
    <div class="scr-greet">Your <em>${t('calm.subtitle')}</em></div>
  </div>
  <div id="p-mindfulness"></div>`;

  rMindful();
}
