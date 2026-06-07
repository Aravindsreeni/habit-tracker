// ── habits.js — Habits destination: segmented Daily·Weekly·Monthly·Quarterly·Yearly ──
// Grove-styled view with .grv-seg horizon switcher, .grv-card habit rows,
// .grv-progress bars, and inline add-goal forms. Store logic reused directly.
import {
  HABITS, D, W, M, Q, Y, sv, svHabits,
  wRange, mName, qName, yName,
  linkProgress, linkSources, linkLabel
} from '../store.js';
import { icon } from '../icons.js';
import { t } from '../i18n.js';

// ── Module state ─────────────────────────────────────────────────────
let _h       = 'daily';   // active horizon
let _addOpen = false;     // add-form visible

// ── Helpers ───────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function pct(v, max) { return max ? Math.min(100, Math.round((v / max) * 100)) : 0; }

function progressBar(val, max, done, caption) {
  return `<div class="grv-progress">
    <div class="grv-progress__track">
      <div class="grv-progress__fill${done ? '' : ' grv-progress__fill--honey'}"
        style="width:${pct(val, max)}%"></div>
    </div>
    ${caption ? `<div class="grv-progress__cap">${caption}</div>` : ''}
  </div>`;
}

// ── Data accessors per horizon ────────────────────────────────────────
function _habits() { return HABITS[_h] || []; }

function _val(h) {
  switch (_h) {
    case 'daily':     return h.type === 'c' ? (D[h.id] === true ? 1 : 0) : (D[h.id] || 0);
    case 'weekly':    return W[h.id] || 0;
    case 'monthly':   return M[h.id] || 0;
    case 'quarterly': return h.link ? linkProgress('quarterly', h.link) : (Q[h.id] || 0);
    case 'yearly':    return h.link ? linkProgress('yearly', h.link) : (Y[h.id] || 0);
    default:          return 0;
  }
}
function _max(h) {
  return _h === 'daily' ? (h.type === 'c' ? 1 : (h.max || 8)) : (h.target || 1);
}
function _done(h) { return _val(h) >= _max(h); }

function _unit() {
  const map = {
    daily:     'habits.unit_daily',
    weekly:    'habits.unit_weekly',
    monthly:   'habits.unit_monthly',
    quarterly: 'habits.unit_quarterly',
    yearly:    'habits.unit_yearly',
  };
  return t(map[_h] || 'habits.unit_daily');
}

function _periodLabel() {
  switch (_h) {
    case 'weekly':    return `Week of ${wRange()}`;
    case 'monthly':   return mName();
    case 'quarterly': return qName();
    case 'yearly':    return yName();
    default:          return t('habits.tab_daily');
  }
}

function _horizonLabel(h) {
  const map = {
    daily:     'habits.tab_daily',
    weekly:    'habits.tab_weekly',
    monthly:   'habits.tab_monthly',
    quarterly: 'habits.tab_quarterly',
    yearly:    'habits.tab_yearly',
  };
  return t(map[h] || h);
}

// ── Habit card HTML ───────────────────────────────────────────────────
function _card(h) {
  const v     = _val(h), max = _max(h), done = v >= max;
  const unit  = _unit();
  const cap   = done
    ? t('habits.cap_done', { unit })
    : t('habits.cap_remaining', { remaining: max - v, unit });
  const linked = (_h === 'quarterly' || _h === 'yearly') && h.link;

  let ctrl = '';
  if (_h === 'daily') {
    if (h.type === 'c') {
      ctrl = `<button class="grv-check grv-check--round" role="checkbox"
        aria-checked="${done ? 'true' : 'false'}"
        aria-label="${esc(h.label)}" data-chk="${h.id}"></button>`;
    } else {
      ctrl = `<div class="counter" style="flex-shrink:0">
        <button class="counter__btn" data-cnt="${h.id}" data-delta="-1" data-max="${h.max||8}">−</button>
        <span class="counter__val">${v}<small>/${max}</small></span>
        <button class="counter__btn" data-cnt="${h.id}" data-delta="1" data-max="${h.max||8}">+</button>
      </div>`;
    }
  } else if (!linked) {
    const attr = _h === 'weekly' ? 'data-wk' : _h === 'monthly' ? 'data-mo'
               : _h === 'quarterly' ? 'data-qt' : 'data-yr';
    ctrl = `<div class="counter" style="flex-shrink:0">
      <button class="counter__btn" ${attr}="${h.id}" data-delta="-1">−</button>
      <span class="counter__val">${v}<small>/${max}</small></span>
      <button class="counter__btn" ${attr}="${h.id}" data-delta="1">+</button>
    </div>`;
  } else {
    ctrl = `<span class="grv-badge grv-badge--${done ? 'sage' : 'honey'}">${v}/${max}</span>`;
  }

  const linkCap = linked
    ? `<div style="margin-top:4px;font-size:11px;color:var(--text-muted)">${t('habits.link_fed', { label: esc(linkLabel(h.link)) })}</div>`
    : '';

  return `<div class="grv-card${done ? ' grv-card--done' : ''}" style="padding:14px 16px;margin-bottom:8px">
    <div class="between" style="margin-bottom:${_h === 'daily' && h.type !== 'c' ? '10px' : '12px'}">
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
        ${_h === 'daily' && h.type === 'c' ? ctrl : ''}
        <span class="cardtitle" style="font-size:14px;font-weight:500;${done ? 'color:var(--sage-deep)' : ''}">${esc(h.label)}</span>
      </div>
      ${_h !== 'daily' || h.type !== 'c' ? ctrl : ''}
    </div>
    ${progressBar(v, max, done, cap)}
    ${linkCap}
  </div>`;
}

// ── Add form HTML per horizon ─────────────────────────────────────────
function _addForm() {
  const isGoal = _h === 'quarterly' || _h === 'yearly';
  if (!_addOpen) {
    const lbl = isGoal ? t('habits.add_goal') : t('habits.add_habit');
    return `<button class="grv-btn grv-btn--sm grv-btn--ghost" id="hb-open-btn" style="margin-top:6px">${lbl}</button>`;
  }

  const inpStyle = 'font-size:13px;border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:6px 10px;background:var(--surface-inset);color:var(--text-primary);outline:none;font-family:var(--font-ui)';
  const namePh   = isGoal ? t('habits.goal_name') : t('habits.habit_name');
  const nameField = `<input id="hb-name" type="text" placeholder="${namePh}"
    style="flex:1;min-width:100px;height:36px;padding:0 12px;${inpStyle}">`;

  let extra = '';
  if (_h === 'daily') {
    extra = `<select id="hb-type" style="${inpStyle}">
      <option value="c">${t('habits.type_checkbox')}</option>
      <option value="w">${t('habits.type_counter')}</option>
    </select>
    <input id="hb-max" type="number" min="1" max="100" value="8" placeholder="${t('habits.max_label')}"
      style="width:64px;height:36px;${inpStyle}" hidden>`;
  } else if (_h === 'weekly') {
    extra = `<input id="hb-target" type="number" min="1" max="7" value="3" placeholder="${t('habits.target_week')}"
      style="width:90px;height:36px;${inpStyle}">`;
  } else if (_h === 'monthly') {
    extra = `<input id="hb-target" type="number" min="1" max="31" value="7" placeholder="${t('habits.target_month')}"
      style="width:100px;height:36px;${inpStyle}">`;
  } else if (_h === 'quarterly') {
    const linkOpts = linkSources('quarterly').map(o =>
      `<option value="${o.period}:${o.habitId}">${esc(o.period)} · ${esc(o.label)}</option>`).join('');
    extra = `<input id="hb-target" type="number" min="1" max="99" value="1" placeholder="${t('habits.target_quarter')}"
      style="width:110px;height:36px;${inpStyle}">
    <select id="hb-link" style="${inpStyle}">
      <option value="">${t('habits.no_link')}</option>${linkOpts}
    </select>`;
  } else if (_h === 'yearly') {
    const linkOpts = linkSources('yearly').map(o =>
      `<option value="${o.period}:${o.habitId}">${esc(o.period)} · ${esc(o.label)}</option>`).join('');
    extra = `<input id="hb-target" type="number" min="1" max="365" value="1" placeholder="${t('habits.target_year')}"
      style="width:110px;height:36px;${inpStyle}">
    <select id="hb-link" style="${inpStyle}">
      <option value="">${t('habits.no_link')}</option>${linkOpts}
    </select>`;
  }

  return `<div class="grv-card" style="padding:14px 16px;margin-top:6px">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      ${nameField}${extra}
      <button class="grv-btn grv-btn--sm grv-btn--secondary" id="hb-save-btn">${t('common.add')}</button>
      <button class="grv-btn grv-btn--sm grv-btn--ghost" id="hb-cancel-btn">${t('common.cancel')}</button>
    </div>
  </div>`;
}

// ── Full destination HTML ─────────────────────────────────────────────
function _html() {
  const hs   = _habits();
  const done = hs.filter(h => _done(h)).length;
  const tone = done === hs.length && hs.length > 0 ? 'sage' : 'honey';

  const periodLbl = _periodLabel();
  const cards = hs.length
    ? hs.map(_card).join('')
    : `<div style="font-size:14px;color:var(--text-muted);padding:16px 0">${t('habits.no_habits', { horizon: _horizonLabel(_h).toLowerCase() })}</div>`;

  const seg = ['daily','weekly','monthly','quarterly','yearly'].map(h =>
    `<button class="grv-seg__opt" role="tab" aria-selected="${_h===h ? 'true':'false'}" data-hz="${h}">
      ${_horizonLabel(h)}</button>`
  ).join('');

  const summary = hs.length
    ? `<span class="grv-badge grv-badge--${tone}" style="margin-left:auto">
        ${t('habits.summary', { done, total: hs.length })}
       </span>`
    : '';

  return `<div class="scr-head">
    <div class="scr-eyebrow">${t('habits.title')}</div>
    <div class="scr-greet">Your <em>${t('habits.subtitle')}</em></div>
  </div>
  <div style="display:flex;justify-content:center;margin-bottom:18px;overflow-x:auto">
    <div class="grv-seg" role="tablist" aria-label="Horizon">${seg}</div>
  </div>
  <div class="sec-eyebrow">
    <span>${esc(periodLbl).toUpperCase()}</span>
    ${summary}
  </div>
  <div id="hb-list">${cards}</div>
  ${_addForm()}`;
}

// ── Render ────────────────────────────────────────────────────────────
export function render() {
  const el = document.getElementById('p-habits');
  if (!el) return;
  el.innerHTML = _html();
  _wire(el);
}

// ── Wire interactions ─────────────────────────────────────────────────
function _wire(el) {
  el.querySelectorAll('[data-hz]').forEach(btn => {
    btn.onclick = () => { _h = btn.dataset.hz; _addOpen = false; render(); };
  });

  el.querySelectorAll('[data-chk]').forEach(btn => {
    btn.onclick = () => { D[btn.dataset.chk] = !D[btn.dataset.chk]; sv('d'); render(); };
  });
  el.querySelectorAll('[data-cnt]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.cnt, max = parseInt(btn.dataset.max), d = parseInt(btn.dataset.delta);
      D[id] = Math.max(0, Math.min(max, (D[id] || 0) + d)); sv('d'); render();
    };
  });

  el.querySelectorAll('[data-wk]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.wk, d = parseInt(btn.dataset.delta);
      W[id] = Math.max(0, (W[id] || 0) + d); sv('w'); render();
    };
  });
  el.querySelectorAll('[data-mo]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.mo, d = parseInt(btn.dataset.delta);
      M[id] = Math.max(0, (M[id] || 0) + d); sv('m'); render();
    };
  });
  el.querySelectorAll('[data-qt]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.qt, d = parseInt(btn.dataset.delta);
      Q[id] = Math.max(0, (Q[id] || 0) + d); sv('qt'); render();
    };
  });
  el.querySelectorAll('[data-yr]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.yr, d = parseInt(btn.dataset.delta);
      Y[id] = Math.max(0, (Y[id] || 0) + d); sv('y'); render();
    };
  });

  el.querySelector('#hb-open-btn')?.addEventListener('click', () => {
    _addOpen = true; render(); setTimeout(() => el.querySelector('#hb-name')?.focus(), 20);
  });
  el.querySelector('#hb-cancel-btn')?.addEventListener('click', () => { _addOpen = false; render(); });

  const typeEl = el.querySelector('#hb-type');
  if (typeEl) {
    typeEl.addEventListener('change', () => {
      const maxEl = el.querySelector('#hb-max');
      if (maxEl) maxEl.hidden = typeEl.value !== 'w';
    });
  }

  const nameInp = el.querySelector('#hb-name');
  const save = () => {
    const name = nameInp?.value.trim(); if (!name) { nameInp?.focus(); return; }
    const target = parseInt(el.querySelector('#hb-target')?.value) || 1;
    const linkVal = el.querySelector('#hb-link')?.value || '';

    if (_h === 'daily') {
      const type = el.querySelector('#hb-type')?.value || 'c';
      const max  = parseInt(el.querySelector('#hb-max')?.value) || 8;
      HABITS.daily.push(type === 'w' ? { id: 'h'+Date.now(), label: name, type: 'w', max } : { id: 'h'+Date.now(), label: name, type: 'c' });
    } else if (_h === 'weekly') {
      HABITS.weekly.push({ id: 'h'+Date.now(), label: name, target: parseInt(el.querySelector('#hb-target')?.value)||3 });
    } else if (_h === 'monthly') {
      HABITS.monthly.push({ id: 'h'+Date.now(), label: name, target: parseInt(el.querySelector('#hb-target')?.value)||7 });
    } else if (_h === 'quarterly') {
      const goal = { id: 'h'+Date.now(), label: name, target };
      if (linkVal) { const [p, hid] = linkVal.split(':'); goal.link = { period: p, habitId: hid }; }
      HABITS.quarterly.push(goal);
    } else if (_h === 'yearly') {
      const goal = { id: 'h'+Date.now(), label: name, target };
      if (linkVal) { const [p, hid] = linkVal.split(':'); goal.link = { period: p, habitId: hid }; }
      HABITS.yearly.push(goal);
    }

    svHabits(); _addOpen = false; render();
  };
  nameInp?.addEventListener('keydown', ev => { if (ev.key === 'Enter') save(); });
  el.querySelector('#hb-save-btn')?.addEventListener('click', save);
}
