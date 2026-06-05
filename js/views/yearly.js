// ── yearly.js — Yearly habits view ────────────────────────────────
import { HABITS, Y, sv, svHabits, yName } from '../store.js';
import { mkCard, mkSum } from '../ui.js';
import { wireNotes, wireDel } from './notes.js';

export function render() {
  document.getElementById('yrlbl').textContent = yName();

  const hs      = HABITS.yearly || [];
  const tot     = hs.reduce((s, h) => s + Math.min(Y[h.id] || 0, h.target), 0);
  const max     = hs.reduce((s, h) => s + h.target, 0);
  const allDone = hs.length > 0 && hs.every(h => (Y[h.id] || 0) >= h.target);

  mkSum(
    document.getElementById('yrsum'),
    tot, max,
    hs.filter(h => (Y[h.id] || 0) >= h.target).length, hs.length,
    allDone
  );

  const el = document.getElementById('yrl');
  el.innerHTML = '';

  hs.forEach(h => {
    const v    = Y[h.id] || 0;
    const done = v >= h.target;
    const note = (Y.remarks && Y.remarks[h.id]) || '';
    const pct  = Math.min(100, Math.round(v / h.target * 100));
    const ctrl = `<div class="cnt"><button class="cb" data-yr="${h.id}" data-delta="-1">−</button><span class="cv">${v}<span class="ct">/${h.target}</span></span><button class="cb" data-yr="${h.id}" data-delta="1">+</button></div>`;
    const pb   = `<div class="pw"><div class="pb"><div class="pf${done ? ' ok' : ''}" style="width:${pct}%"></div></div></div>`;
    el.appendChild(mkCard(h.id, h.label, ctrl, note, pb, 'yearly', done, false));
  });

  if (!hs.length) el.innerHTML = '<div class="empty">No yearly goals yet — add one above</div>';

  el.querySelectorAll('[data-yr]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.yr, delta = parseInt(btn.dataset.delta);
      Y[id] = Math.max(0, (Y[id] || 0) + delta);
      sv('y'); render();
    };
  });
  wireNotes(el, 'yearly');
  wireDel(el, delHabit);
}

export function showAddForm()  {
  document.querySelectorAll('.ahfrm').forEach(f => f.classList.remove('on'));
  const f = document.getElementById('af-yearly');
  if (f) { f.classList.add('on'); setTimeout(() => f.querySelector('.fi')?.focus(), 30); }
}
export function closeAddForm() {
  const f = document.getElementById('af-yearly');
  if (f) { f.classList.remove('on'); const fi = f.querySelector('.fi'); if (fi) fi.value = ''; }
}
export function addHabit() {
  const nameEl = document.getElementById('fn-yearly');
  const name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { if (nameEl) nameEl.focus(); return; }
  const target = parseInt(document.getElementById('ft-yearly').value) || 1;
  HABITS.yearly.push({ id: 'h' + Date.now(), label: name, target });
  svHabits();
  closeAddForm();
  render();
}
function delHabit(section, id) {
  if (!confirm('Remove this goal? Your progress data is kept.')) return;
  HABITS.yearly = HABITS.yearly.filter(h => h.id !== id);
  svHabits();
  render();
}

window.showAddForm_yearly  = showAddForm;
window.closeAddForm_yearly = closeAddForm;
window.addHabit_yearly     = addHabit;
