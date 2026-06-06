// ── you.js — You destination: Stats · Settings ───────────────────────
// Grove header + segmented control wrapper. Stats delegates to stats.js;
// Settings delegates to settings.js and appends a Grove-styled sync section.
// Sync buttons are wired here (not in app.js) because they're created
// dynamically inside the Settings tab, after app.js's initial load-time wiring.
import { render as rStats }    from './stats.js';
import { render as rSettings } from './settings.js';
import { syncTrigger, loadTrigger, exportJSON, importJSON } from '../sync.js';

// ── Module state ──────────────────────────────────────────────────────
let _tab = 'stats';

const TABS = [
  { id: 'stats',    label: 'Stats',    pnl: 'p-stats'    },
  { id: 'settings', label: 'Settings', pnl: 'p-settings' },
];

// ── Render ────────────────────────────────────────────────────────────
export function render() {
  const el = document.getElementById('p-you');
  if (!el) return;

  const seg = TABS.map(t =>
    `<button class="grv-seg__opt" role="tab"
      aria-selected="${_tab === t.id ? 'true' : 'false'}"
      data-yt="${t.id}">${t.label}</button>`
  ).join('');

  const panels = TABS.map(t =>
    `<div id="${t.pnl}"${_tab !== t.id ? ' hidden' : ''}></div>`
  ).join('\n    ');

  el.innerHTML = `<div class="scr-head">
    <div class="scr-eyebrow">You</div>
    <div class="scr-greet">Your <em>story</em></div>
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

// Appends a Grove-styled sync/backup card below the settings form,
// then wires the sync buttons (which exist only inside this dynamically
// rendered panel — app.js's load-time getElementById found nothing).
function _appendSync() {
  const pnl = document.getElementById('p-settings');
  if (!pnl) return;

  const section = document.createElement('div');
  section.innerHTML = `<div class="sec-eyebrow" style="margin-top:20px">SYNC &amp; BACKUP</div>
  <div class="grv-card" style="padding:14px 16px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <button class="grv-btn grv-btn--sm grv-btn--secondary" id="syncbtn">↑ Drive</button>
      <button class="grv-btn grv-btn--sm grv-btn--secondary" id="loadbtn">↓ Drive</button>
      <button class="grv-btn grv-btn--sm grv-btn--ghost" id="exportbtn">⬇ Export JSON</button>
      <button class="grv-btn grv-btn--sm grv-btn--ghost" id="importbtn">⬆ Import JSON</button>
    </div>
    <div class="muted" id="syncinfo" style="font-size:12px">Sync to Google Drive to access your habits from any device.</div>
  </div>`;

  pnl.appendChild(section);

  section.querySelector('#syncbtn')?.addEventListener('click',  syncTrigger);
  section.querySelector('#loadbtn')?.addEventListener('click',  loadTrigger);
  section.querySelector('#exportbtn')?.addEventListener('click', exportJSON);
  section.querySelector('#importbtn')?.addEventListener('click', importJSON);
}
