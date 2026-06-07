// ── settings.js — Settings view (theme + language + reminders) ────
import { lsGet, lsSet } from '../store.js';
import {
  PRESETS, getReminders, addReminder, toggleReminder, deleteReminder,
  snooze, dismiss, getRemaining, isDue, getTodayCount,
  initReminders, requestNotificationPermission
} from '../reminders.js';
import { initLang, getLang } from '../i18n.js';

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
  else _applySystem(root);

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

// ── Language ───────────────────────────────────────────────────────
async function _setLang(lang) {
  const s = lsGet(SETTINGS_KEY) || {};
  s.lang = lang;
  lsSet(SETTINGS_KEY, s);
  await initLang(lang);
  // Allow mindfulness panel to rebuild with new strings (only if no timer running).
  const { resetBuilt } = await import('./mindfulness.js');
  resetBuilt();
  // Re-render all destination views so translated strings appear immediately.
  const { renderAll } = await import('./_all.js');
  renderAll();
}

// ── Init reminders (called once from app.js) ───────────────────────
export function initRem() {
  initReminders(() => {
    _renderBanners();
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
      import('../ui.js').then(m => m.toast(t('settings.eye_logged', { count })));
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

  const lang = getLang();
  el.innerHTML = `
    <!-- Theme -->
    <div class="sec-eyebrow" style="margin-top:8px">${t('settings.title')}</div>
    <div class="grv-card">
      <div class="between">
        <span class="cardtitle" style="font-size:14px">${t('settings.section_theme')}</span>
        <div class="grv-seg" role="group" aria-label="Theme">
          ${[['system','settings.theme_system'],['light','settings.theme_light'],['dark','settings.theme_dark']].map(([th, tk]) => `
            <button class="grv-seg__opt"
              aria-selected="${theme === th ? 'true' : 'false'}"
              data-theme-btn="${th}">${t(tk)}</button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Language -->
    <div class="grv-card" style="margin-top:8px">
      <div class="between">
        <span class="cardtitle" style="font-size:14px">${t('settings.section_language')}</span>
        <div class="grv-seg" role="group" aria-label="Language">
          <button class="grv-seg__opt" aria-selected="${lang === 'en' ? 'true' : 'false'}" data-lang-btn="en">${t('settings.lang_en')}</button>
          <button class="grv-seg__opt" aria-selected="${lang === 'ml' ? 'true' : 'false'}" data-lang-btn="ml">${t('settings.lang_ml')}</button>
        </div>
      </div>
    </div>

    <!-- Reminders -->
    <div class="sec-eyebrow">
      ${t('settings.section_reminders')}
      <button class="grv-btn grv-btn--sm grv-btn--secondary" id="rem-perm-btn">${t('settings.enable_notifications')}</button>
    </div>
    <div class="muted" style="margin:-6px 0 14px;font-size:12px">
      ${t('settings.reminders_note')}
    </div>

    <!-- Active reminders list -->
    <div class="stack">
      ${rems.length ? rems.map(r => {
        const rem = getRemaining(r.id);
        const due = isDue(r.id);
        const count = getTodayCount(r.id);
        const note  = r.label.toLowerCase().includes('eye') && count >= 4
          ? ` <span class="rem-note">${t('settings.rem_pref_drops')}</span>` : '';
        return `<div class="grv-card${due ? ' grv-card--done' : ''}">
          <div class="between" style="margin-bottom:5px">
            <span class="cardtitle" style="font-size:14px">${r.label}${note}</span>
            <div style="display:flex;align-items:center;gap:10px">
              ${due
                ? `<span class="grv-badge grv-badge--sage">${t('settings.due_now')}</span>`
                : `<span class="muted" style="font-size:12px;font-variant-numeric:tabular-nums">${_fmt(rem)}</span>`}
              <input type="checkbox" class="grv-switch" data-rem-tog="${r.id}"
                ${r.enabled ? 'checked' : ''} title="Enable / disable">
              <button class="grv-iconbtn grv-iconbtn--sm" data-rem-del="${r.id}"
                title="${t('common.delete')}" style="font-size:18px;line-height:1">×</button>
            </div>
          </div>
          <div class="muted" style="font-size:12px">
            ${t('settings.rem_detail', { mins: r.minutes, from: r.activeFrom, to: r.activeTo, count })}
          </div>
        </div>`;
      }).join('') : `<div class="muted" style="text-align:center;padding:10px 0">${t('settings.no_reminders')}</div>`}
    </div>

    <!-- Add reminder form -->
    <div class="grv-card" style="margin-top:12px">
      <div class="cardtitle" style="margin-bottom:14px">${t('settings.add_reminder_title')}</div>
      <div class="grv-field" style="margin-bottom:10px">
        <input class="grv-field__input" id="rem-lbl-inp" type="text"
          placeholder="${t('settings.rem_label_ph')}">
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <select class="grv-field__input" id="rem-preset-sel" style="flex:1">
          <option value="">${t('settings.rem_custom')}</option>
          ${PRESETS.map(p => `<option value="${p.minutes}">${p.label}</option>`).join('')}
        </select>
        <input class="grv-field__input" id="rem-mins-inp" type="number"
          min="1" max="480" value="60" style="width:72px;text-align:center">
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <span class="muted" style="flex-shrink:0;font-size:12px">${t('settings.active_hours')}</span>
        <input class="grv-field__input" id="rem-from" type="time" value="08:00" style="width:108px">
        <span class="muted">→</span>
        <input class="grv-field__input" id="rem-to"   type="time" value="22:00" style="width:108px">
      </div>
      <div style="display:flex;justify-content:flex-end">
        <button class="grv-btn grv-btn--sm" id="rem-add-btn">${t('settings.add_reminder_btn')}</button>
      </div>
    </div>`;

  // Wire theme buttons
  el.querySelectorAll('[data-theme-btn]').forEach(btn => {
    btn.onclick = () => { _setTheme(btn.dataset.themeBtn); render(); };
  });
  // Wire language buttons
  el.querySelectorAll('[data-lang-btn]').forEach(btn => {
    btn.onclick = () => { _setLang(btn.dataset.langBtn); };
  });
  // Wire notification permission
  el.querySelector('#rem-perm-btn')?.addEventListener('click', async () => {
    const r = await requestNotificationPermission();
    import('../ui.js').then(m => m.toast(
      r === 'granted' ? t('settings.notif_granted') :
      r === 'denied'  ? t('settings.notif_denied')  :
                        t('settings.notif_unsupported'), r === 'granted'));
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
    import('../ui.js').then(m => m.toast(t('settings.rem_added', { label })));
    render();
  });
  // Wire toggle switches
  el.querySelectorAll('[data-rem-tog]').forEach(cb => {
    cb.onchange = () => { toggleReminder(cb.dataset.remTog); render(); };
  });
  // Wire delete buttons
  el.querySelectorAll('[data-rem-del]').forEach(btn => {
    btn.onclick = () => {
      const remLabel = getReminders().find(r => r.id === btn.dataset.remDel)?.label;
      if (confirm(t('settings.rem_delete_confirm', { label: remLabel }))) {
        deleteReminder(btn.dataset.remDel); render();
      }
    };
  });
}
