// ── daily.js — Daily habits view ──────────────────────────────────
import { HABITS, D, sv, svHabits } from '../store.js';
import { mkCard, ckSVG } from '../ui.js';
import { wireNotes, wireDel } from './notes.js';

export function render() {
  const el = document.getElementById('dl');
  if (!el) return;
  el.innerHTML = '';

  HABITS.daily.forEach(h => {
    const max  = h.max || 8;
    const val  = h.type === 'c' ? (D[h.id] === true) : (D[h.id] || 0);
    const done = h.type === 'c' ? val : val >= max;
    const note = (D.remarks && D.remarks[h.id]) || '';
    let ctrl = '', extra = '';

    if (h.type === 'c') {
      ctrl = `<button class="chk${val ? ' on' : ''}" data-chk="${h.id}">${val ? ckSVG() : ''}</button>`;
    } else {
      ctrl  = `<div class="cnt"><button class="cb" data-aw="${h.id}" data-delta="-1" data-max="${max}">−</button><span class="cv">${val}<span class="ct">/${max}</span></span><button class="cb" data-aw="${h.id}" data-delta="1" data-max="${max}">+</button></div>`;
      extra = `<div class="dots">${Array.from({ length: max }, (_, i) => `<div class="dot${i < val ? ' on' : ''}" data-sw-dot="${h.id}" data-sw-v="${i + 1}" data-sw-max="${max}"></div>`).join('')}</div>`;
    }

    el.appendChild(mkCard(h.id, h.label, ctrl, note, extra, 'daily', done, done && h.type === 'c'));
  });

  if (!HABITS.daily.length) {
    el.innerHTML = '<div class="empty">No daily habits yet — add one above</div>';
  }

  // Wire interactions
  el.querySelectorAll('[data-chk]').forEach(btn => {
    btn.onclick = () => { D[btn.dataset.chk] = !D[btn.dataset.chk]; sv('d'); render(); };
  });
  el.querySelectorAll('[data-aw]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.aw, max = parseInt(btn.dataset.max), delta = parseInt(btn.dataset.delta);
      D[id] = Math.max(0, Math.min(max, (D[id] || 0) + delta));
      sv('d'); render();
    };
  });
  el.querySelectorAll('[data-sw-dot]').forEach(dot => {
    dot.onclick = () => {
      const id = dot.dataset.swDot, v = parseInt(dot.dataset.swV), max = parseInt(dot.dataset.swMax);
      D[id] = (D[id] || 0) === v ? v - 1 : v;
      sv('d'); render();
    };
  });
  wireNotes(el, 'daily');
  wireDel(el, delHabit);
}

// ── Add form ───────────────────────────────────────────────────────
export function showAddForm()  {
  document.querySelectorAll('.ahfrm').forEach(f => f.classList.remove('on'));
  const f = document.getElementById('af-daily');
  if (f) { f.classList.add('on'); setTimeout(() => f.querySelector('.fi')?.focus(), 30); }
}
export function closeAddForm() {
  const f = document.getElementById('af-daily');
  if (f) { f.classList.remove('on'); const fi = f.querySelector('.fi'); if (fi) fi.value = ''; }
}
export function toggleMaxField() {
  const t = document.getElementById('ft-daily');
  const m = document.getElementById('fm-daily');
  if (t && m) m.style.display = t.value === 'w' ? 'inline-block' : 'none';
}
export function addHabit() {
  const nameEl = document.getElementById('fn-daily');
  const name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { if (nameEl) nameEl.focus(); return; }
  const id   = 'h' + Date.now();
  const type = document.getElementById('ft-daily').value;
  const max  = parseInt(document.getElementById('fm-daily').value) || 8;
  HABITS.daily.push(type === 'w' ? { id, label: name, type: 'w', max } : { id, label: name, type: 'c' });
  svHabits();
  closeAddForm();
  render();
}
function delHabit(section, id) {
  if (!confirm('Remove this habit? Your progress data is kept.')) return;
  HABITS.daily = HABITS.daily.filter(h => h.id !== id);
  svHabits();
  render();
}

// Expose for inline HTML handlers (transitional)
window.showAddForm_daily  = showAddForm;
window.closeAddForm_daily = closeAddForm;
window.toggleMaxField     = toggleMaxField;
window.addHabit_daily     = addHabit;
