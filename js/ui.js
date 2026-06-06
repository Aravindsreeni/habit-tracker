// ── ui.js — shared UI helpers: icons, cards, toast ────────────────
import { icon } from './icons.js';

// ── Icons (Lucide, via icons.js) ───────────────────────────────────
export const ckSVG  = () => icon('check',  { size: 14 });
export const penSVG = () => icon('pencil', { size: 14 });
export const xSVG   = () => icon('x',      { size: 14 });

// ── Toast ──────────────────────────────────────────────────────────
let _toastTimer = null;
export function toast(msg, ok = true) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.borderColor = ok ? 'rgba(74,142,82,0.5)' : 'rgba(188,58,58,0.4)';
  t.classList.add('on');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

// ── Card builder ───────────────────────────────────────────────────
export function mkCard(id, label, ctrl, note, extra, section, done, strike) {
  const c = document.createElement('div');
  c.className = `hc${done ? ' done' : ''}`;
  c.id = `hc-${id}`;
  c.innerHTML = `
    <div class="hr">
      <span class="hn${strike ? ' sk' : ''}">${label}</span>
      ${ctrl}
      <button class="rnb${note ? ' noted' : ''}" id="rb-${id}" data-note-id="${id}">${penSVG()}</button>
      <button class="hdel" data-del-section="${section}" data-del-id="${id}">${xSVG()}</button>
    </div>
    ${extra || ''}
    <div class="ra" id="ra-${id}">
      <textarea class="rta" placeholder="Add a note…" data-note-section="${section}" data-note-habit="${id}">${note}</textarea>
    </div>`;
  return c;
}

// ── Summary bar ────────────────────────────────────────────────────
export function mkSum(el, tot, max, cnt, total, allDone) {
  el.innerHTML = `
    <div>
      <div class="sl">Days logged</div>
      <div class="sn${allDone ? ' ok' : ''}">${tot}/${max}</div>
    </div>
    <div>
      <div class="sl">Habits done</div>
      <div class="sn${allDone ? ' ok' : ''}">${cnt}/${total}</div>
    </div>
    <div style="flex:2">
      <div class="sl">Progress</div>
      <div style="margin-top:7px">
        <div class="pb">
          <div class="pf${allDone ? ' ok' : ''}" style="width:${max ? Math.round(tot / max * 100) : 0}%"></div>
        </div>
      </div>
    </div>`;
}

// ── Note toggle ────────────────────────────────────────────────────
export function openNote(key) {
  const a = document.getElementById(`ra-${key}`);
  if (!a) return;
  const was = a.classList.contains('on');

  document.querySelectorAll('.ra').forEach(x  => x.classList.remove('on'));
  document.querySelectorAll('.rnb').forEach(x => x.classList.remove('on'));

  if (!was) {
    a.classList.add('on');
    const b = document.getElementById(`rb-${key}`);
    if (b) b.classList.add('on');
    setTimeout(() => { const ta = a.querySelector('textarea'); if (ta) ta.focus(); }, 30);
  }
}
