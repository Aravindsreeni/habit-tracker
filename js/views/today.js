// ── today.js — Today destination: hero + daily habits + routine + quick wins ──
// Grove-styled view. Reads from store; no calls to daily/routine/tasks render fns.
import { HABITS, D, QW, ROUTINE, sv, svHabits, svRoutine, setRoutine, setQW, p2 } from '../store.js';
import { icon } from '../icons.js';
import { completedDaySets, currentStreak } from './stats.js';
import { t } from '../i18n.js';

// ── Module state ─────────────────────────────────────────────────────
let _winsFilter   = 'all';
let _winsFormOpen = false;

// ── Helpers ───────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _defaultTimes() {
  const d = new Date(); d.setSeconds(0, 0);
  d.setMinutes(Math.round(d.getMinutes() / 30) * 30);
  const s = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  d.setMinutes(d.getMinutes() + 30);
  return { s, e: `${p2(d.getHours())}:${p2(d.getMinutes())}` };
}

function _greet() {
  const h = new Date().getHours();
  return h < 12 ? t('today.greeting_morning')
       : h < 18 ? t('today.greeting_afternoon')
                : t('today.greeting_evening');
}

function _affirmation(done, total) {
  if (total > 0 && done === total) return t('today.affirm_all_done');
  if (done === 0) return t('today.affirm_none');
  return t('today.affirm_progress');
}

// ── Progress ring SVG ─────────────────────────────────────────────────
function _ring(done, total) {
  const r = 36, c = +(2 * Math.PI * r).toFixed(2);
  const off = +(c * (1 - (total ? done / total : 0))).toFixed(2);
  return `<div class="ring">
    <svg width="84" height="84" aria-hidden="true">
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--bg-sunk)" stroke-width="8"/>
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--sage)" stroke-width="8"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
        style="transition:stroke-dashoffset .6s var(--ease-out)"/>
    </svg>
    <div class="ring__num">${done}<small>${t('today.ring_of')} ${total}</small></div>
  </div>`;
}

// ── Daily habit rows ──────────────────────────────────────────────────
function _habitRows(daySets) {
  if (!HABITS.daily.length) {
    return `<div style="font-size:14px;color:var(--text-muted);padding:16px 0">${t('today.no_habits')}</div>`;
  }
  return HABITS.daily.map(h => {
    const max    = h.max || 8;
    const val    = h.type === 'c' ? (D[h.id] === true) : (D[h.id] || 0);
    const done   = h.type === 'c' ? val : val >= max;
    const streak = daySets ? currentStreak(daySets[h.id] || new Set()) : 0;
    const badge  = streak > 0
      ? `<span class="grv-badge grv-badge--honey"><span class="grv-badge__dot"></span>${t('today.streak_badge', { n: streak })}</span>`
      : '';
    const ctrl = h.type !== 'c'
      ? `<div class="counter">
           <button class="counter__btn" data-cnt="${h.id}" data-delta="-1" data-max="${max}">−</button>
           <span class="counter__val">${val}<small>/${max}</small></span>
           <button class="counter__btn" data-cnt="${h.id}" data-delta="1" data-max="${max}">+</button>
         </div>`
      : '';
    return `<div class="grv-card${done ? ' grv-card--done' : ''}" style="padding:14px 16px">
      <div class="habit${done && h.type === 'c' ? ' done' : ''}">
        <button class="grv-check grv-check--round"
          role="checkbox" aria-checked="${done ? 'true' : 'false'}"
          aria-label="${esc(h.label)}" data-chk="${h.id}"></button>
        <div class="habit__body">
          <div class="habit__name">${esc(h.label)}</div>
          <div class="habit__meta">${badge}</div>
        </div>
        ${ctrl}
      </div>
    </div>`;
  }).join('');
}

// ── Routine section HTML ──────────────────────────────────────────────
function _routineHtml() {
  const done = ROUTINE.filter(b => b.done).length;
  const { s, e } = _defaultTimes();
  const inStyle = 'font-size:13px;border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:6px 8px;background:var(--surface-inset);color:var(--text-primary);outline:none';
  const blocks  = [...ROUTINE].sort((a, b) => a.start.localeCompare(b.start)).map(blk =>
    `<div class="grv-card${blk.done ? ' grv-card--done' : ''}" style="padding:12px 14px;margin-bottom:8px">
      <div class="between">
        <span style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono)">${esc(blk.start)}–${esc(blk.end)}</span>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="grv-check grv-check--round" role="checkbox"
            aria-checked="${blk.done ? 'true' : 'false'}"
            aria-label="${t('today.done_aria', { label: esc(blk.label) })}" data-rt-done="${blk.id}"></button>
          <button class="grv-iconbtn grv-iconbtn--sm" aria-label="${t('today.delete_block')}" data-rt-del="${blk.id}">
            ${icon('x', { size: 14 })}
          </button>
        </div>
      </div>
      <div style="margin-top:6px;font-size:14px;${blk.done ? 'color:var(--text-muted);text-decoration:line-through' : 'color:var(--text-primary)'}">${esc(blk.label)}</div>
    </div>`
  ).join('') || `<div style="font-size:14px;color:var(--text-muted);padding:8px 0">${t('today.no_blocks')}</div>`;

  return `<div class="sec-eyebrow" style="margin-top:28px">
    <span>${t('today.section_routine')}${ROUTINE.length ? ` · ${done}/${ROUTINE.length}` : ''}</span>
  </div>
  <div class="grv-card" style="padding:14px 16px;margin-bottom:10px">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input id="rt-start" type="time" value="${s}" style="${inStyle};font-family:var(--font-mono)">
      <span style="color:var(--text-muted);font-size:13px">–</span>
      <input id="rt-end" type="time" value="${e}" style="${inStyle};font-family:var(--font-mono)">
      <input id="rt-label" type="text" placeholder="${t('today.routine_ph')}" autocomplete="off"
        style="flex:1;min-width:100px;height:36px;padding:0 12px;font-family:var(--font-ui);${inStyle}">
      <button class="grv-btn grv-btn--sm grv-btn--secondary" id="rt-addbtn">${t('common.add')}</button>
    </div>
  </div>
  <div id="today-rt-list">${blocks}</div>`;
}

// ── Quick Wins section HTML ───────────────────────────────────────────
const PRI_W     = { high: 0, med: 1, low: 2 };
const PRI_TONE  = { high: 'clay', med: 'honey', low: 'sage' };
const inpStyle  = 'font-size:13px;border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:6px 8px;background:var(--surface-inset);color:var(--text-primary);outline:none';

function _priLabel(pri) {
  return { high: t('today.priority_high'), med: t('today.priority_med'), low: t('today.priority_low') }[pri] || pri;
}

function _winsHtml() {
  let list = [...QW];
  if      (_winsFilter === 'pending') list = QW.filter(q => q.status === 'pending');
  else if (_winsFilter === 'done')    list = QW.filter(q => q.status === 'done');
  list.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return (PRI_W[a.priority||'med'] * 100 + parseInt(a.effort||10))
         - (PRI_W[b.priority||'med'] * 100 + parseInt(b.effort||10));
  });

  const cards = list.length ? list.map(q => {
    const done = q.status === 'done', pri = q.priority || 'med';
    const ariaLbl = done
      ? t('today.mark_pending', { label: esc(q.task) })
      : t('today.mark_done',    { label: esc(q.task) });
    return `<div class="grv-card${done ? ' grv-card--done' : ''}" style="padding:12px 14px;margin-bottom:8px">
      <div class="between">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
          <button class="grv-check grv-check--round" role="checkbox"
            aria-checked="${done ? 'true' : 'false'}"
            aria-label="${ariaLbl}" data-tq="${q.id}"></button>
          <span style="font-size:14px;${done ? 'text-decoration:line-through;color:var(--text-muted)' : 'color:var(--text-primary)'}">${esc(q.task)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <span class="grv-badge grv-badge--${PRI_TONE[pri]}">${_priLabel(pri)}</span>
          <span style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono)">${t('today.effort_min', { n: q.effort })}</span>
          <button class="grv-iconbtn grv-iconbtn--sm" aria-label="${t('today.delete_task')}" data-dq="${q.id}">
            ${icon('x', { size: 14 })}
          </button>
        </div>
      </div>
    </div>`;
  }).join('') : `<div style="font-size:14px;color:var(--text-muted);padding:8px 0">${_winsFilter === 'done' ? t('today.no_tasks_done') : t('today.no_tasks_pending')}</div>`;

  const filterBtns = [
    { key: 'all',     tk: 'today.filter_all'     },
    { key: 'pending', tk: 'today.filter_pending' },
    { key: 'done',    tk: 'today.filter_done'    },
  ].map(f =>
    `<button style="font-size:11px;padding:3px 10px;border-radius:var(--radius-pill);border:1px solid var(--border-subtle);cursor:pointer;background:${_winsFilter===f.key ? 'var(--sage)' : 'var(--surface-inset)'};color:${_winsFilter===f.key ? '#fff' : 'var(--text-muted)'}" data-wf="${f.key}">${t(f.tk)}</button>`
  ).join('');

  const form = _winsFormOpen ? `
    <div class="grv-card" style="padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input id="wins-inp" type="text" placeholder="${t('today.task_ph')}"
          style="flex:1;min-width:140px;height:36px;padding:0 12px;font-family:var(--font-ui);${inpStyle}">
        <select id="wins-pri" style="${inpStyle}">
          <option value="high">${t('today.priority_high')}</option>
          <option value="med" selected>${t('today.priority_med')}</option>
          <option value="low">${t('today.priority_low')}</option>
        </select>
        <select id="wins-eff" style="${inpStyle}">
          <option value="5">${t('today.effort_min', { n: 5 })}</option>
          <option value="10" selected>${t('today.effort_min', { n: 10 })}</option>
          <option value="30">${t('today.effort_min', { n: 30 })}</option>
        </select>
        <button class="grv-btn grv-btn--sm grv-btn--secondary" id="wins-addbtn">${t('common.add')}</button>
        <button class="grv-btn grv-btn--sm grv-btn--ghost" id="wins-cancelbtn">${t('common.cancel')}</button>
      </div>
    </div>` : `<button class="grv-btn grv-btn--sm grv-btn--ghost" id="wins-openbtn" style="margin-bottom:10px">${t('today.add_task')}</button>`;

  return `<div class="sec-eyebrow" style="margin-top:28px">
    <span>${t('today.section_wins')}</span>
    <div style="display:flex;gap:5px">${filterBtns}</div>
  </div>
  ${form}
  <div id="today-wins-list">${cards}</div>`;
}

// ── Render ────────────────────────────────────────────────────────────
export function render() {
  const el = document.getElementById('p-today');
  if (!el) return;

  const habits  = HABITS.daily;
  const daySets = habits.length ? completedDaySets(habits) : null;
  const done    = habits.filter(h =>
    h.type === 'c' ? D[h.id] === true : (D[h.id] || 0) >= (h.max || 8)
  ).length;
  const total = habits.length;
  const dateLine = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });

  el.innerHTML = `
    <div class="scr-head between">
      <div>
        <div class="scr-eyebrow">${dateLine}</div>
        <div class="scr-greet">${_greet()}, <em>you.</em></div>
      </div>
    </div>

    <div class="hero">
      <div class="hero__line">${_affirmation(done, total)}</div>
      <div class="hero__row">
        ${_ring(done, total)}
        <div style="flex:1">
          <div style="font-size:14px;color:var(--text-secondary);line-height:1.5">
            ${t('today.habits_tended', { done, total })}
            ${total - done > 0 ? t('today.habits_waiting', { n: total - done }) : t('today.all_done')}
          </div>
        </div>
      </div>
    </div>

    <div class="sec-eyebrow"><span>${t('today.section_habits')}</span><span>${done}/${total}</span></div>
    <div class="stack">${_habitRows(daySets)}</div>

    <div class="quickadd">
      <input id="today-habit-inp" type="text" placeholder="${t('today.quickadd_ph')}">
      <button class="grv-iconbtn grv-iconbtn--accent" id="today-habit-add" aria-label="${t('common.add')}">
        ${icon('plus', { size: 20 })}
      </button>
    </div>

    ${_routineHtml()}
    ${_winsHtml()}`;

  _wire(el);
}

// ── Wire all interactions ─────────────────────────────────────────────
function _wire(el) {
  // Daily: check/uncheck
  el.querySelectorAll('[data-chk]').forEach(btn => {
    btn.onclick = () => { D[btn.dataset.chk] = !D[btn.dataset.chk]; sv('d'); render(); };
  });
  // Daily: counter ± buttons
  el.querySelectorAll('[data-cnt]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.cnt, max = parseInt(btn.dataset.max), delta = parseInt(btn.dataset.delta);
      D[id] = Math.max(0, Math.min(max, (D[id] || 0) + delta));
      sv('d'); render();
    };
  });
  // Daily: quickadd
  const hInp = el.querySelector('#today-habit-inp');
  const hAdd = el.querySelector('#today-habit-add');
  const addHabit = () => {
    const name = hInp?.value.trim(); if (!name) { hInp?.focus(); return; }
    HABITS.daily.push({ id: 'h' + Date.now(), label: name, type: 'c' });
    svHabits(); if (hInp) hInp.value = ''; render();
  };
  hInp?.addEventListener('keydown', ev => { if (ev.key === 'Enter') addHabit(); });
  if (hAdd) hAdd.onclick = addHabit;

  // Routine: check done
  el.querySelectorAll('[data-rt-done]').forEach(btn => {
    btn.onclick = () => {
      const blk = ROUTINE.find(b => b.id === btn.dataset.rtDone);
      if (blk) { blk.done = !blk.done; svRoutine(); render(); }
    };
  });
  // Routine: delete
  el.querySelectorAll('[data-rt-del]').forEach(btn => {
    btn.onclick = () => { setRoutine(ROUTINE.filter(b => b.id !== btn.dataset.rtDel)); svRoutine(); render(); };
  });
  // Routine: add block
  const rtLabel = el.querySelector('#rt-label');
  const addBlock = () => {
    const s = el.querySelector('#rt-start')?.value;
    const e = el.querySelector('#rt-end')?.value;
    const label = rtLabel?.value.trim();
    if (!label) { rtLabel?.focus(); return; }
    ROUTINE.push({ id: 'r' + Date.now(), start: s || '', end: e || '', label, done: false });
    svRoutine(); render(); el.querySelector('#rt-label')?.focus();
  };
  rtLabel?.addEventListener('keydown', ev => { if (ev.key === 'Enter') addBlock(); });
  el.querySelector('#rt-addbtn')?.addEventListener('click', addBlock);

  // Wins: filter buttons
  el.querySelectorAll('[data-wf]').forEach(btn => {
    btn.onclick = () => { _winsFilter = btn.dataset.wf; render(); };
  });
  // Wins: open/cancel form
  el.querySelector('#wins-openbtn')?.addEventListener('click', () => {
    _winsFormOpen = true; render(); setTimeout(() => el.querySelector('#wins-inp')?.focus(), 20);
  });
  el.querySelector('#wins-cancelbtn')?.addEventListener('click', () => { _winsFormOpen = false; render(); });
  // Wins: add task
  const wInp = el.querySelector('#wins-inp');
  const addWin = () => {
    const task = wInp?.value.trim(); if (!task) { wInp?.focus(); return; }
    QW.push({ id: 'q' + Date.now(), task,
      effort:   el.querySelector('#wins-eff')?.value || '10',
      priority: el.querySelector('#wins-pri')?.value || 'med',
      status: 'pending' });
    sv('q'); _winsFormOpen = false; render();
  };
  wInp?.addEventListener('keydown', ev => { if (ev.key === 'Enter') addWin(); });
  el.querySelector('#wins-addbtn')?.addEventListener('click', addWin);
  // Wins: toggle task done
  el.querySelectorAll('[data-tq]').forEach(btn => {
    btn.onclick = () => {
      const q = QW.find(x => x.id === btn.dataset.tq); if (!q) return;
      q.status = q.status === 'done' ? 'pending' : 'done'; sv('q'); render();
    };
  });
  // Wins: delete task
  el.querySelectorAll('[data-dq]').forEach(btn => {
    btn.onclick = () => { setQW(QW.filter(x => x.id !== btn.dataset.dq)); sv('q'); render(); };
  });
}
