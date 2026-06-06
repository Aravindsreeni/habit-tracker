// ── reflect.js — Reflect destination: Mood · Journal · Thoughts · Inbox ──
// Thin Grove wrapper: provides header + segmented control, creates the
// sub-view containers, and delegates rendering to the existing sub-modules.
// Each sub-module retains its own store logic; we just supply the IA shell.
import { render as rMood }    from './mood.js';
import { render as rJournal } from './journal.js';
import { render as rCbt }     from './cbt.js';
import { render as rInbox }   from './inbox.js';

// ── Module state ──────────────────────────────────────────────────────
let _tab = 'mood';

const TABS = [
  { id: 'mood',     label: 'Mood',     pnl: 'p-mood'    },
  { id: 'journal',  label: 'Journal',  pnl: 'p-journal' },
  { id: 'thoughts', label: 'Thoughts', pnl: 'p-cbt'     },
  { id: 'inbox',    label: 'Inbox',    pnl: 'p-inbox'   },
];

// ── Render ────────────────────────────────────────────────────────────
export function render() {
  const el = document.getElementById('p-reflect');
  if (!el) return;

  const seg = TABS.map(t =>
    `<button class="grv-seg__opt" role="tab"
      aria-selected="${_tab === t.id ? 'true' : 'false'}"
      data-rt="${t.id}">${t.label}</button>`
  ).join('');

  // All four sub-containers live here; only the active one is visible.
  // The sub-view render() functions find their containers via getElementById.
  const panels = TABS.map(t =>
    `<div id="${t.pnl}"${_tab !== t.id ? ' hidden' : ''}></div>`
  ).join('\n    ');

  el.innerHTML = `<div class="scr-head">
    <div class="scr-eyebrow">Reflect</div>
    <div class="scr-greet">Your <em>inner space</em></div>
  </div>
  <div style="display:flex;justify-content:center;margin-bottom:18px;overflow-x:auto">
    <div class="grv-seg" role="tablist" aria-label="Section">${seg}</div>
  </div>
  ${panels}`;

  // Render only the active sub-view — inactive containers stay empty until visited
  _renderActive();

  // Wire tab switching
  el.querySelectorAll('[data-rt]').forEach(btn => {
    btn.onclick = () => { _tab = btn.dataset.rt; render(); };
  });
}

function _renderActive() {
  if (_tab === 'mood')     rMood();
  if (_tab === 'journal')  rJournal();
  if (_tab === 'thoughts') rCbt();
  if (_tab === 'inbox')    rInbox();
}
