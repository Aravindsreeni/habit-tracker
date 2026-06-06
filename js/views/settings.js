// ── settings.js — Settings view (theme + reminders) ───────────────
import { lsGet, lsSet } from '../store.js';
import {
  PRESETS, getReminders, addReminder, toggleReminder, deleteReminder,
  snooze, dismiss, getRemaining, isDue, getTodayCount,
  initReminders, requestNotificationPermission
} from '../reminders.js';

const SETTINGS_KEY = 'ht_settings';

// ── Apply theme on startup (before first paint) ────────────────────
export function applyTheme() {
  const s = lsGet(SETTINGS_KEY) || {};
  _setTheme(s.theme || 'system');
}

let _mq = null;   // cached prefers-color-scheme listener (for theme: 'system')

function _setTheme(t) {
  const root = document.documentElement;
  // Grove's dark theme is attribute-only ([data-theme="dark"]); there is no
  // prefers-color-scheme block, so 'system' must be resolved here via matchMedia.
  if (t === 'dark')       root.setAttribute('data-theme', 'dark');
  else if (t === 'light') root.setAttribute('data-theme', 'light');
  else _applySystem(root);   // 'system'

  // Track OS changes only while following the system preference.
  if (window.matchMedia) {
    if (!_mq) _mq = window.matchMedia('(prefers-color-scheme: dark)');
    _mq.onchange = (t === 'system') ? () => _applySystem(root) : null;
  }

  const s = lsGet(SETTINGS_KEY) || {};
  s.theme = t;
  lsSet(SETTINGS_KEY, s);
}

function _applySystem(root) {
  const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
}

// ── Init reminders (called once from app.js) ───────────────────────
export function initRem() {
  initReminders(() => {
    // Re-render the active reminder banners at the top of the page
    _renderBanners();
    // Re-render settings if it's open (countdown update)
    if (document.getElementById('p-settings')?.classList.contains('on')) render();
  });
}

// ── In-app reminder banners ────────────────────────────────────────
function _renderBanners() {
  let container = document.getElementById('rem-banners');
  if (!container) {
    container = document.createElement('div');
    container.id = 'rem-banners';
    document.querySelector('nav')?.insertAdjacentElement('afterend', container);
  }
  const rems = getReminders().filter(r => r.enabled && isDue(r.id));
  if (!rems.length) { container.innerHTML = ''; return; }

  container.innerHTML = rems.map(r => {
    const count = getTodayCount(r.id);
    const note  = r.label.toLowerCase().includes('eye') && count >= 4
      ? ' <span class="rem-note">(≥4× today — prefer preservative-free drops)</span>' : '';
    return `<div class="rem-banner" data-rem-id="${r.id}">
      <span class="rem-lbl">👁 ${r.label}${note}</span>
      <div class="rem-acts">
        <button class="rem-btn" data-rem-snooze="${r.id}" data-mins="5">+5m</button>
        <button class="rem-btn" data-rem-snooze="${r.id}" data-mins="10">+10m</button>
        <button class="rem-btn rem-done" data-rem-dismiss="${r.id}">✓ Done</button>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('[data-rem-snooze]').forEach(btn => {
    btn.onclick = () => { snooze(btn.dataset.remSnooze, parseInt(btn.dataset.mins)); };
  });
  container.querySelectorAll('[data-rem-dismiss]').forEach(btn => {
    btn.onclick = () => {
      const count = dismiss(btn.dataset.remDismiss);
      import('../ui.js').then(m => m.toast(`Eye drops logged ✓  (${count}× today)`));
    };
  });
}

// ── Format remaining time ──────────────────────────────────────────
function _fmt(ms) {
  if (ms === null) return '—';
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

// ── Render settings panel ──────────────────────────────────────────
export function render() {
  const el = document.getElementById('p-settings');
  if (!el) return;
  const s     = lsGet(SETTINGS_KEY) || {};
  const theme = s.theme || 'system';
  const rems  = getReminders();

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">Settings</span>
    </div>

    <!-- Theme -->
    <div class="hc" style="margin-bottom:10px">
      <div class="hr" style="flex-wrap:wrap;gap:10px">
        <span class="hn" style="font-size:13px">Theme</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${['system','light','dark'].map(t => `
            <button class="fsv${theme === t ? ' stg-on' : ''}" data-theme-btn="${t}"
              style="font-size:12px;padding:4px 12px">${t.charAt(0).toUpperCase()+t.slice(1)}</button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Reminders -->
    <div class="sec-hdr">
      <span class="sec-lbl">Reminders</span>
      <button class="sec-add" id="rem-perm-btn">Enable notifications</button>
    </div>
    <div class="stg-note">Reminders fire while this tab is open. Background notifications require the future mobile app.</div>

    <!-- Active reminders -->
    ${rems.length ? rems.map(r => {
      const rem = getRemaining(r.id);
      const due = isDue(r.id);
      return `<div class="hc rem-row${due ? ' rem-due' : ''}" style="margin-bottom:7px">
        <div class="hr">
          <span class="hn" style="font-size:13px">${r.label}</span>
          <span class="rem-cd${due ? ' rem-cd-due' : ''}">${due ? '⏰ Due now' : _fmt(rem)}</span>
          <button class="hdel" data-rem-del="${r.id}" title="Delete">×</button>
        </div>
        <div style="padding:0 13px 8px;font-size:11px;color:var(--t3)">
          Every ${r.minutes}m · Active ${r.activeFrom}–${r.activeTo}
          · Today: ${getTodayCount(r.id)}×
          <label class="rem-tog">
            <input type="checkbox" data-rem-tog="${r.id}" ${r.enabled ? 'checked' : ''}>
            <span>On</span>
          </label>
        </div>
      </div>`;
    }).join('') : '<div class="empty" style="padding:16px 0">No reminders set</div>'}

    <!-- Add reminder form -->
    <div class="hc" style="margin-top:6px">
      <div class="hr" style="flex-wrap:wrap;gap:8px">
        <span class="hn" style="font-size:12px;color:var(--t3)">Add reminder</span>
      </div>
      <div style="padding:0 13px 12px">
        <div class="frow" style="margin-bottom:8px">
          <input class="fi" id="rem-lbl-inp" type="text" placeholder="Label (e.g. Eye drops)">
        </div>
        <div class="frow" style="margin-bottom:8px">
          <select class="fse" id="rem-preset-sel">
            <option value="">— Custom —</option>
            ${PRESETS.map(p => `<option value="${p.minutes}">${p.label}</option>`).join('')}
          </select>
          <input class="fnum" id="rem-mins-inp" type="number" min="1" max="480" value="60" placeholder="min" style="width:70px">
        </div>
        <div class="frow" style="margin-bottom:8px">
          <label style="font-size:12px;color:var(--t2);align-self:center">Active hours</label>
          <input class="fnum" id="rem-from" type="time" value="08:00" style="width:90px">
          <span style="font-size:12px;color:var(--t3);align-self:center">→</span>
          <input class="fnum" id="rem-to"   type="time" value="22:00" style="width:90px">
        </div>
        <div class="fact">
          <button class="fsv" id="rem-add-btn">Add reminder</button>
        </div>
      </div>
    </div>`;

  // Wire theme buttons
  el.querySelectorAll('[data-theme-btn]').forEach(btn => {
    btn.onclick = () => { _setTheme(btn.dataset.themeBtn); render(); };
  });
  // Wire notification permission
  el.querySelector('#rem-perm-btn')?.addEventListener('click', async () => {
    const r = await requestNotificationPermission();
    import('../ui.js').then(m => m.toast(
      r === 'granted' ? 'Notifications enabled ✓' :
      r === 'denied'  ? 'Notifications blocked — allow in browser settings' :
                        'Notifications not supported in this browser', r === 'granted'));
  });
  // Wire preset select → update minutes input
  el.querySelector('#rem-preset-sel')?.addEventListener('change', e => {
    if (e.target.value) document.getElementById('rem-mins-inp').value = e.target.value;
  });
  // Wire add button
  el.querySelector('#rem-add-btn')?.addEventListener('click', () => {
    const label = document.getElementById('rem-lbl-inp')?.value.trim();
    const mins  = parseInt(document.getElementById('rem-mins-inp')?.value) || 60;
    const from  = document.getElementById('rem-from')?.value || '08:00';
    const to    = document.getElementById('rem-to')?.value   || '22:00';
    if (!label) { document.getElementById('rem-lbl-inp')?.focus(); return; }
    addReminder(label, mins, from, to);
    import('../ui.js').then(m => m.toast(`Reminder "${label}" added ✓`));
    render();
  });
  // Wire toggle checkboxes
  el.querySelectorAll('[data-rem-tog]').forEach(cb => {
    cb.onchange = () => { toggleReminder(cb.dataset.remTog); render(); };
  });
  // Wire delete
  el.querySelectorAll('[data-rem-del]').forEach(btn => {
    btn.onclick = () => { if (confirm(`Delete reminder "${getReminders().find(r=>r.id===btn.dataset.remDel)?.label}"?`)) { deleteReminder(btn.dataset.remDel); render(); } };
  });
}
