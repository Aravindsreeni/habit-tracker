// ── reflect.js — Reflect destination: Mood · Journal · Thoughts · Inbox ──
// Thin Grove wrapper: provides header + segmented control, creates the
// sub-view containers, and delegates rendering to the existing sub-modules.
// Each sub-module retains its own store logic; we just supply the IA shell.
import { render as rMood }    from './mood.js';
import { render as rJournal } from './journal.js';
import { render as rCbt }     from './cbt.js';
import { render as rInbox }   from './inbox.js';
import { t } from '../i18n.js';

// ── Module state ──────────────────────────────────────────────────────
let _tab = 'mood';

const TAB_KEYS = [
  { id: 'mood',     pnl: 'p-mood',    tk: 'reflect.tab_mood'     },
  { id: 'journal',  pnl: 'p-journal', tk: 'reflect.tab_journal'  },
  { id: 'thoughts', pnl: 'p-cbt',     tk: 'reflect.tab_thoughts' },
  { id: 'inbox',    pnl: 'p-inbox',   tk: 'reflect.tab_inbox'    },
];

// ── Render ────────────────────────────────────────────────────────────
export function render() {
  const el = document.getElementById('p-reflect');
  if (!el) return;

  const seg = TAB_KEYS.map(t_ =>
    `<button class="grv-seg__opt" role="tab"
      aria-selected="${_tab === t_.id ? 'true' : 'false'}"
      data-rt="${t_.id}">${t(t_.tk)}</button>`
  ).join('');

  const panels = TAB_KEYS.map(t_ =>
    `<div id="${t_.pnl}"${_tab !== t_.id ? ' hidden' : ''}></div>`
  ).join('\n    ');

  el.innerHTML = `<div class="scr-head">
    <div class="scr-eyebrow">${t('reflect.title')}</div>
    <div class="scr-greet">Your <em>${t('reflect.subtitle')}</em></div>
  </div>
  <div style="display:flex;justify-content:center;margin-bottom:18px;overflow-x:auto">
    <div class="grv-seg" role="tablist" aria-label="Section">${seg}</div>
  </div>
  ${panels}`;

  _renderActive();

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
