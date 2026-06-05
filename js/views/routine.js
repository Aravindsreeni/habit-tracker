// ── routine.js — Time-blocked daily routine ───────────────────────
// A simple, low-friction day plan: add time blocks, tick them off.
// Positive reinforcement only — undone blocks are never shamed.
import { ROUTINE, setRoutine, svRoutine, p2 } from '../store.js';
import { xSVG, ckSVG } from '../ui.js';

// Next half-hour boundary, and the block after it, as "HH:MM" strings
function defaultTimes() {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(Math.round(d.getMinutes() / 30) * 30);
  const s = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  d.setMinutes(d.getMinutes() + 30);
  const e = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  return { s, e };
}

export function render() {
  const el = document.getElementById('p-routine');
  if (!el) return;

  const done  = ROUTINE.filter(b => b.done).length;
  const { s, e } = defaultTimes();

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">Routine${ROUTINE.length ? ` · ${done}/${ROUTINE.length}` : ''}</span>
    </div>
    <div class="rt-add">
      <input class="rt-time" id="rt-start" type="time" value="${s}">
      <span class="rt-dash">–</span>
      <input class="rt-time" id="rt-end" type="time" value="${e}">
      <input class="fi" id="rt-label" type="text" placeholder="What's the block?" autocomplete="off">
      <button class="fsv" id="rt-addbtn">Add</button>
    </div>
    <div id="rt-list"></div>`;

  _renderList();

  const label = el.querySelector('#rt-label');
  label?.addEventListener('keydown', ev => { if (ev.key === 'Enter') _add(); });
  el.querySelector('#rt-addbtn')?.addEventListener('click', _add);
}

function _renderList() {
  const listEl = document.getElementById('rt-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!ROUTINE.length) {
    listEl.innerHTML = '<div class="empty">No blocks yet — sketch out your day above</div>';
    return;
  }

  [...ROUTINE].sort((a, b) => a.start.localeCompare(b.start)).forEach(blk => {
    const c = document.createElement('div');
    c.className = `hc rt-card${blk.done ? ' done' : ''}`;
    c.innerHTML = `
      <div class="hr">
        <span class="rt-when">${blk.start}<span class="rt-dash">–</span>${blk.end}</span>
        <span class="hn${blk.done ? ' sk' : ''}">${_esc(blk.label)}</span>
        <button class="qk${blk.done ? ' dn' : ''}" title="Done" data-rt-done="${blk.id}">${blk.done ? ckSVG() : ''}</button>
        <button class="hdel" title="Delete" data-rt-del="${blk.id}">${xSVG()}</button>
      </div>`;
    listEl.appendChild(c);
  });

  listEl.querySelectorAll('[data-rt-done]').forEach(btn => {
    btn.onclick = () => {
      const blk = ROUTINE.find(b => b.id === btn.dataset.rtDone);
      if (blk) { blk.done = !blk.done; svRoutine(); render(); }
    };
  });
  listEl.querySelectorAll('[data-rt-del]').forEach(btn => {
    btn.onclick = () => {
      setRoutine(ROUTINE.filter(b => b.id !== btn.dataset.rtDel));
      svRoutine(); render();
    };
  });
}

function _add() {
  const startEl = document.getElementById('rt-start');
  const endEl   = document.getElementById('rt-end');
  const labelEl = document.getElementById('rt-label');
  const label   = labelEl?.value.trim();
  const start   = startEl?.value || '';
  const end     = endEl?.value || '';
  if (!label) { labelEl?.focus(); return; }
  if (!start || !end) { (start ? endEl : startEl)?.focus(); return; }
  ROUTINE.push({ id: 'r' + Date.now(), start, end, label, done: false });
  svRoutine();
  render();
  document.getElementById('rt-label')?.focus();
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
