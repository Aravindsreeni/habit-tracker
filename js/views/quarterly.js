// ── quarterly.js — Quarterly habits view ──────────────────────────
import { HABITS, Q, sv, svHabits, qName } from '../store.js';
import { mkCard, mkSum } from '../ui.js';
import { wireNotes, wireDel } from './notes.js';

export function render() {
  document.getElementById('qtlbl').textContent = qName();

  const hs      = HABITS.quarterly || [];
  const tot     = hs.reduce((s, h) => s + Math.min(Q[h.id] || 0, h.target), 0);
  const max     = hs.reduce((s, h) => s + h.target, 0);
  const allDone = hs.length > 0 && hs.every(h => (Q[h.id] || 0) >= h.target);

  mkSum(
    document.getElementById('qtsum'),
    tot, max,
    hs.filter(h => (Q[h.id] || 0) >= h.target).length, hs.length,
    allDone
  );

  const el = document.getElementById('qtl');
  el.innerHTML = '';

  hs.forEach(h => {
    const v    = Q[h.id] || 0;
    const done = v >= h.target;
    const note = (Q.remarks && Q.remarks[h.id]) || '';
    const pct  = Math.min(100, Math.round(v / h.target * 100));
    const ctrl = `<div class="cnt"><button class="cb" data-qt="${h.id}" data-delta="-1">−</button><span class="cv">${v}<span class="ct">/${h.target}</span></span><button class="cb" data-qt="${h.id}" data-delta="1">+</button></div>`;
    const pb   = `<div class="pw"><div class="pb"><div class="pf${done ? ' ok' : ''}" style="width:${pct}%"></div></div></div>`;
    el.appendChild(mkCard(h.id, h.label, ctrl, note, pb, 'quarterly', done, false));
  });

  if (!hs.length) el.innerHTML = '<div class="empty">No quarterly goals yet — add one above</div>';

  el.querySelectorAll('[data-qt]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.qt, delta = parseInt(btn.dataset.delta);
      Q[id] = Math.max(0, (Q[id] || 0) + delta);
      sv('qt'); render();
    };
  });
  wireNotes(el, 'quarterly');
  wireDel(el, delHabit);
}

export function showAddForm()  {
  document.querySelectorAll('.ahfrm').forEach(f => f.classList.remove('on'));
  const f = document.getElementById('af-quarterly');
  if (f) { f.classList.add('on'); setTimeout(() => f.querySelector('.fi')?.focus(), 30); }
}
export function closeAddForm() {
  const f = document.getElementById('af-quarterly');
  if (f) { f.classList.remove('on'); const fi = f.querySelector('.fi'); if (fi) fi.value = ''; }
}
export function addHabit() {
  const nameEl = document.getElementById('fn-quarterly');
  const name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { if (nameEl) nameEl.focus(); return; }
  const target = parseInt(document.getElementById('ft-quarterly').value) || 1;
  HABITS.quarterly.push({ id: 'h' + Date.now(), label: name, target });
  svHabits();
  closeAddForm();
  render();
}
function delHabit(section, id) {
  if (!confirm('Remove this goal? Your progress data is kept.')) return;
  HABITS.quarterly = HABITS.quarterly.filter(h => h.id !== id);
  svHabits();
  render();
}

window.showAddForm_quarterly  = showAddForm;
window.closeAddForm_quarterly = closeAddForm;
window.addHabit_quarterly     = addHabit;
