// ── monthly.js — Monthly habits view ──────────────────────────────
import { HABITS, M, sv, svHabits, mName } from '../store.js';
import { mkCard, mkSum } from '../ui.js';
import { wireNotes, wireDel } from './notes.js';

export function render() {
  if (!document.getElementById('ml')) return;
  document.getElementById('mlbl').textContent = mName();

  const hs      = HABITS.monthly;
  const tot     = hs.reduce((s, h) => s + Math.min(M[h.id] || 0, h.target), 0);
  const max     = hs.reduce((s, h) => s + h.target, 0);
  const allDone = hs.length > 0 && hs.every(h => (M[h.id] || 0) >= h.target);

  mkSum(
    document.getElementById('msum'),
    tot, max,
    hs.filter(h => (M[h.id] || 0) >= h.target).length, hs.length,
    allDone
  );

  const el = document.getElementById('ml');
  el.innerHTML = '';

  hs.forEach(h => {
    const v    = M[h.id] || 0;
    const done = v >= h.target;
    const note = (M.remarks && M.remarks[h.id]) || '';
    const pct  = Math.min(100, Math.round(v / h.target * 100));
    const ctrl = `<div class="cnt"><button class="cb" data-mo="${h.id}" data-delta="-1">−</button><span class="cv">${v}<span class="ct">/${h.target}</span></span><button class="cb" data-mo="${h.id}" data-delta="1">+</button></div>`;
    const pb   = `<div class="pw"><div class="pb"><div class="pf${done ? ' ok' : ''}" style="width:${pct}%"></div></div></div>`;
    el.appendChild(mkCard(h.id, h.label, ctrl, note, pb, 'monthly', done, false));
  });

  if (!hs.length) el.innerHTML = '<div class="empty">No monthly habits yet — add one above</div>';

  el.querySelectorAll('[data-mo]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.mo, delta = parseInt(btn.dataset.delta);
      M[id] = Math.max(0, (M[id] || 0) + delta);
      sv('m'); render();
    };
  });
  wireNotes(el, 'monthly');
  wireDel(el, delHabit);
}

export function showAddForm()  {
  document.querySelectorAll('.ahfrm').forEach(f => f.classList.remove('on'));
  const f = document.getElementById('af-monthly');
  if (f) { f.classList.add('on'); setTimeout(() => f.querySelector('.fi')?.focus(), 30); }
}
export function closeAddForm() {
  const f = document.getElementById('af-monthly');
  if (f) { f.classList.remove('on'); const fi = f.querySelector('.fi'); if (fi) fi.value = ''; }
}
export function addHabit() {
  const nameEl = document.getElementById('fn-monthly');
  const name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { if (nameEl) nameEl.focus(); return; }
  const target = parseInt(document.getElementById('ft-monthly').value) || 7;
  HABITS.monthly.push({ id: 'h' + Date.now(), label: name, target });
  svHabits();
  closeAddForm();
  render();
}
function delHabit(section, id) {
  if (!confirm('Remove this habit? Your progress data is kept.')) return;
  HABITS.monthly = HABITS.monthly.filter(h => h.id !== id);
  svHabits();
  render();
}

window.showAddForm_monthly  = showAddForm;
window.closeAddForm_monthly = closeAddForm;
window.addHabit_monthly     = addHabit;
