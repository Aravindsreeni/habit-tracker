// ── habits.js — Habits destination: segmented Daily·Weekly·Monthly·Quarterly·Yearly ──
// Grove-styled view with .grv-seg horizon switcher, .grv-card habit rows,
// .grv-progress bars, and inline add-goal forms. Store logic reused directly.
import {
  HABITS, D, W, M, Q, Y, sv, svHabits,
  wRange, mName, qName, yName,
  linkProgress, linkSources, linkLabel
} from '../store.js';
import { icon } from '../icons.js';

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
  return { daily: 'today', weekly: 'this week', monthly: 'this month',
           quarterly: 'this quarter', yearly: 'this year' }[_h];
}

function _periodLabel() {
  switch (_h) {
    case 'weekly':    return `Week of ${wRange()}`;
    case 'monthly':   return mName();
    case 'quarterly': return qName();
    case 'yearly':    return yName();
    default:          return 'Daily';
  }
}

// ── Habit card HTML ───────────────────────────────────────────────────
function _card(h) {
  const v     = _val(h), max = _max(h), done = v >= max;
  const p     = pct(v, max);
  const unit  = _unit();
  const cap   = done ? `Complete — lovely work ${unit}` : `${max - v} to go ${unit}`;
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

  const linkCap = linked ? `<div style="margin-top:4px;font-size:11px;color:var(--text-muted)">↗ fed by ${esc(linkLabel(h.link))}</div>` : '';

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
  if (!_addOpen) {
    const lbl = _h === 'quarterly' || _h === 'yearly' ? 'Add goal' : 'Add habit';
    return `<button class="grv-btn grv-btn--sm grv-btn--ghost" id="hb-open-btn" style="margin-top:6px">+ ${lbl}</button>`;
  }

  const inpStyle = 'font-size:13px;border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:6px 10px;background:var(--surface-inset);color:var(--text-primary);outline:none;font-family:var(--font-ui)';
  const nameField = `<input id="hb-name" type="text" placeholder="${_h === 'quarterly' || _h === 'yearly' ? 'Goal name' : 'Habit name'}"
    style="flex:1;min-width:100px;height:36px;padding:0 12px;${inpStyle}">`;

  let extra = '';
  if (_h === 'daily') {
    extra = `<select id="hb-type" style="${inpStyle}">
      <option value="c">Checkbox</option>
      <option value="w">Counter</option>
    </select>
    <input id="hb-max" type="number" min="1" max="100" value="8" placeholder="Max"
      style="width:64px;height:36px;${inpStyle}" hidden>`;
  } else if (_h === 'weekly') {
    extra = `<input id="hb-target" type="number" min="1" max="7" value="3" placeholder="Days/week"
      style="width:90px;height:36px;${inpStyle}">`;
  } else if (_h === 'monthly') {
    extra = `<input id="hb-target" type="number" min="1" max="31" value="7" placeholder="Days/month"
      style="width:100px;height:36px;${inpStyle}">`;
  } else if (_h === 'quarterly') {
    const linkOpts = linkSources('quarterly').map(o =>
      `<option value="${o.period}:${o.habitId}">${esc(o.period)} · ${esc(o.label)}</option>`).join('');
    extra = `<input id="hb-target" type="number" min="1" max="99" value="1" placeholder="Target/quarter"
      style="width:110px;height:36px;${inpStyle}">
    <select id="hb-link" style="${inpStyle}">
      <option value="">No link — manual</option>${linkOpts}
    </select>`;
  } else if (_h === 'yearly') {
    const linkOpts = linkSources('yearly').map(o =>
      `<option value="${o.period}:${o.habitId}">${esc(o.period)} · ${esc(o.label)}</option>`).join('');
    extra = `<input id="hb-target" type="number" min="1" max="365" value="1" placeholder="Target/year"
      style="width:110px;height:36px;${inpStyle}">
    <select id="hb-link" style="${inpStyle}">
      <option value="">No link — manual</option>${linkOpts}
    </select>`;
  }

  return `<div class="grv-card" style="padding:14px 16px;margin-top:6px">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      ${nameField}${extra}
      <button class="grv-btn grv-btn--sm grv-btn--secondary" id="hb-save-btn">Add</button>
      <button class="grv-btn grv-btn--sm grv-btn--ghost" id="hb-cancel-btn">Cancel</button>
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
    : `<div style="font-size:14px;color:var(--text-muted);padding:16px 0">No ${_h} habits yet — add one below.</div>`;

  const seg = ['daily','weekly','monthly','quarterly','yearly'].map(h =>
    `<button class="grv-seg__opt" role="tab" aria-selected="${_h===h ? 'true':'false'}" data-hz="${h}">
      ${h[0].toUpperCase()+h.slice(1)}</button>`
  ).join('');

  const summary = hs.length
    ? `<span class="grv-badge grv-badge--${tone}" style="margin-left:auto">
        ${done}/${hs.length} done
       </span>`
    : '';

  return `<div class="scr-head">
    <div class="scr-eyebrow">Habits</div>
    <div class="scr-greet">Your <em>rhythms</em></div>
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
  // Horizon segmented control
  el.querySelectorAll('[data-hz]').forEach(btn => {
    btn.onclick = () => { _h = btn.dataset.hz; _addOpen = false; render(); };
  });

  // Daily: check/uncheck
  el.querySelectorAll('[data-chk]').forEach(btn => {
    btn.onclick = () => { D[btn.dataset.chk] = !D[btn.dataset.chk]; sv('d'); render(); };
  });
  // Daily: counter
  el.querySelectorAll('[data-cnt]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.cnt, max = parseInt(btn.dataset.max), d = parseInt(btn.dataset.delta);
      D[id] = Math.max(0, Math.min(max, (D[id] || 0) + d)); sv('d'); render();
    };
  });

  // Weekly counter
  el.querySelectorAll('[data-wk]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.wk, d = parseInt(btn.dataset.delta);
      W[id] = Math.max(0, (W[id] || 0) + d); sv('w'); render();
    };
  });
  // Monthly counter
  el.querySelectorAll('[data-mo]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.mo, d = parseInt(btn.dataset.delta);
      M[id] = Math.max(0, (M[id] || 0) + d); sv('m'); render();
    };
  });
  // Quarterly counter
  el.querySelectorAll('[data-qt]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.qt, d = parseInt(btn.dataset.delta);
      Q[id] = Math.max(0, (Q[id] || 0) + d); sv('qt'); render();
    };
  });
  // Yearly counter
  el.querySelectorAll('[data-yr]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.yr, d = parseInt(btn.dataset.delta);
      Y[id] = Math.max(0, (Y[id] || 0) + d); sv('y'); render();
    };
  });

  // Add form: open
  el.querySelector('#hb-open-btn')?.addEventListener('click', () => {
    _addOpen = true; render(); setTimeout(() => el.querySelector('#hb-name')?.focus(), 20);
  });
  // Add form: cancel
  el.querySelector('#hb-cancel-btn')?.addEventListener('click', () => { _addOpen = false; render(); });

  // Daily type select toggle (show/hide max field)
  const typeEl = el.querySelector('#hb-type');
  if (typeEl) {
    typeEl.addEventListener('change', () => {
      const maxEl = el.querySelector('#hb-max');
      if (maxEl) maxEl.hidden = typeEl.value !== 'w';
    });
  }

  // Add form: save
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
