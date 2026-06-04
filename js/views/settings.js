// ── settings.js — Settings view ────────────────────────────────────
import { lsGet, lsSet } from '../store.js';

const SETTINGS_KEY = 'ht_settings';

// ── Load / apply theme on startup ─────────────────────────────────
export function applyTheme() {
  const s = lsGet(SETTINGS_KEY) || {};
  setTheme(s.theme || 'system');
}

function setTheme(t) {
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  if      (t === 'light') root.setAttribute('data-theme', 'light');
  else if (t === 'dark')  root.setAttribute('data-theme', 'dark');
  // 'system' → no attribute → prefers-color-scheme applies naturally
  const s = lsGet(SETTINGS_KEY) || {};
  s.theme = t;
  lsSet(SETTINGS_KEY, s);
}

// ── Render ─────────────────────────────────────────────────────────
export function render() {
  const el = document.getElementById('p-settings');
  if (!el) return;
  const s = lsGet(SETTINGS_KEY) || {};
  const theme = s.theme || 'system';

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">Settings</span>
    </div>

    <div class="hc" style="margin-top:4px">
      <div class="hr" style="flex-wrap:wrap;gap:10px">
        <span class="hn" style="font-size:13px">Theme</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${['system','light','dark'].map(t => `
            <button class="fsv${theme === t ? ' stg-on' : ''}" data-theme-btn="${t}"
              style="font-size:12px;padding:4px 12px">${t.charAt(0).toUpperCase()+t.slice(1)}</button>
          `).join('')}
        </div>
      </div>
    </div>`;

  el.querySelectorAll('[data-theme-btn]').forEach(btn => {
    btn.onclick = () => { setTheme(btn.dataset.themeBtn); render(); };
  });
}
