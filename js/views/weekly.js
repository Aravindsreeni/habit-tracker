// ── weekly.js — Weekly habits view ────────────────────────────────
import { HABITS, W, sv, svHabits, wRange } from '../store.js';
import { mkCard, mkSum } from '../ui.js';
import { wireNotes, wireDel } from './notes.js';

export function render() {
  document.getElementById('wlbl').textContent = `Week of ${wRange()}`;

  const hs      = HABITS.weekly;
  const tot     = hs.reduce((s, h) => s + Math.min(W[h.id] || 0, h.target), 0);
  const max     = hs.reduce((s, h) => s + h.target, 0);
  const allDone = hs.length > 0 && hs.every(h => (W[h.id] || 0) >= h.target);

  mkSum(
    document.getElementById('wsum'),
    tot, max,
    hs.filter(h => (W[h.id] || 0) >= h.target).length, hs.length,
    allDone
  );

  const el = document.getElementById('wl');
  el.innerHTML = '';

  hs.forEach(h => {
    const v    = W[h.id] || 0;
    const done = v >= h.target;
    const note = (W.remarks && W.remarks[h.id]) || '';
    const pct  = Math.min(100, Math.round(v / h.target * 100));
    const ctrl = `<div class="cnt"><button class="cb" data-wk="${h.id}" data-delta="-1">−</button><span class="cv">${v}<span class="ct">/${h.target}</span></span><button class="cb" data-wk="${h.id}" data-delta="1">+</button></div>`;
    const pb   = `<div class="pw"><div class="pb"><div class="pf${done ? ' ok' : ''}" style="width:${pct}%"></div></div></div>`;
    el.appendChild(mkCard(h.id, h.label, ctrl, note, pb, 'weekly', done, false));
  });

  if (!hs.length) el.innerHTML = '<div class="empty">No weekly habits yet — add one above</div>';

  el.querySelectorAll('[data-wk]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.wk, delta = parseInt(btn.dataset.delta);
      W[id] = Math.max(0, (W[id] || 0) + delta);
      sv('w'); render();
    };
  });
  wireNotes(el, 'weekly');
  wireDel(el, delHabit);
}

export function showAddForm()  {
  document.querySelectorAll('.ahfrm').forEach(f => f.classList.remove('on'));
  const f = document.getElementById('af-weekly');
  if (f) { f.classList.add('on'); setTimeout(() => f.querySelector('.fi')?.focus(), 30); }
}
export function closeAddForm() {
  const f = document.getElementById('af-weekly');
  if (f) { f.classList.remove('on'); const fi = f.querySelector('.fi'); if (fi) fi.value = ''; }
}
export function addHabit() {
  const nameEl = document.getElementById('fn-weekly');
  const name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { if (nameEl) nameEl.focus(); return; }
  const target = parseInt(document.getElementById('ft-weekly').value) || 3;
  HABITS.weekly.push({ id: 'h' + Date.now(), label: name, target });
  svHabits();
  closeAddForm();
  render();
}
function delHabit(section, id) {
  if (!confirm('Remove this habit? Your progress data is kept.')) return;
  HABITS.weekly = HABITS.weekly.filter(h => h.id !== id);
  svHabits();
  render();
}

window.showAddForm_weekly  = showAddForm;
window.closeAddForm_weekly = closeAddForm;
window.addHabit_weekly     = addHabit;
