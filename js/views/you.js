// ── you.js — You destination: Stats · Settings ───────────────────────
// Grove header + segmented control wrapper. Stats delegates to stats.js;
// Settings delegates to settings.js and appends a Grove-styled sync section.
// Sync buttons are wired here (not in app.js) because they're created
// dynamically inside the Settings tab, after app.js's initial load-time wiring.
import { render as rStats }    from './stats.js';
import { render as rSettings } from './settings.js';
import { syncTrigger, loadTrigger, exportJSON, importJSON } from '../sync.js';
import { t } from '../i18n.js';

// ── Module state ──────────────────────────────────────────────────────
let _tab = 'stats';

const TAB_KEYS = [
  { id: 'stats',    pnl: 'p-stats',    tk: 'you.tab_stats'    },
  { id: 'settings', pnl: 'p-settings', tk: 'you.tab_settings' },
];

// ── Render ────────────────────────────────────────────────────────────
export function render() {
  const el = document.getElementById('p-you');
  if (!el) return;

  const seg = TAB_KEYS.map(t_ =>
    `<button class="grv-seg__opt" role="tab"
      aria-selected="${_tab === t_.id ? 'true' : 'false'}"
      data-yt="${t_.id}">${t(t_.tk)}</button>`
  ).join('');

  const panels = TAB_KEYS.map(t_ =>
    `<div id="${t_.pnl}"${_tab !== t_.id ? ' hidden' : ''}></div>`
  ).join('\n    ');

  el.innerHTML = `<div class="scr-head">
    <div class="scr-eyebrow">${t('you.title')}</div>
    <div class="scr-greet">Your <em>${t('you.subtitle')}</em></div>
  </div>
  <div style="display:flex;justify-content:center;margin-bottom:18px;overflow-x:auto">
    <div class="grv-seg" role="tablist" aria-label="Section">${seg}</div>
  </div>
  ${panels}`;

  if (_tab === 'stats')    rStats();
  if (_tab === 'settings') { rSettings(); _appendSync(); }

  el.querySelectorAll('[data-yt]').forEach(btn => {
    btn.onclick = () => { _tab = btn.dataset.yt; render(); };
  });
}

function _appendSync() {
  const pnl = document.getElementById('p-settings');
  if (!pnl) return;

  const section = document.createElement('div');
  section.innerHTML = `<div class="sec-eyebrow" style="margin-top:20px">${t('you.section_sync')}</div>
  <div class="grv-card" style="padding:14px 16px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <button class="grv-btn grv-btn--sm grv-btn--secondary" id="syncbtn">${t('you.btn_sync')}</button>
      <button class="grv-btn grv-btn--sm grv-btn--secondary" id="loadbtn">${t('you.btn_load')}</button>
      <button class="grv-btn grv-btn--sm grv-btn--ghost" id="exportbtn">${t('you.btn_export')}</button>
      <button class="grv-btn grv-btn--sm grv-btn--ghost" id="importbtn">${t('you.btn_import')}</button>
    </div>
    <div class="muted" id="syncinfo" style="font-size:12px">${t('you.sync_info')}</div>
  </div>`;

  pnl.appendChild(section);

  section.querySelector('#syncbtn')?.addEventListener('click',  syncTrigger);
  section.querySelector('#loadbtn')?.addEventListener('click',  loadTrigger);
  section.querySelector('#exportbtn')?.addEventListener('click', exportJSON);
  section.querySelector('#importbtn')?.addEventListener('click', importJSON);
}
