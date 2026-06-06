// ── quarterly.js — Quarterly habits view ──────────────────────────
import { HABITS, Q, sv, svHabits, qName, linkProgress, linkSources, linkLabel } from '../store.js';
import { mkCard, mkSum } from '../ui.js';
import { wireNotes, wireDel } from './notes.js';

const valOf = h => h.link ? linkProgress('quarterly', h.link) : (Q[h.id] || 0);

export function render() {
  if (!document.getElementById('qtl')) return;
  document.getElementById('qtlbl').textContent = qName();

  const hs      = HABITS.quarterly || [];
  const tot     = hs.reduce((s, h) => s + Math.min(valOf(h), h.target), 0);
  const max     = hs.reduce((s, h) => s + h.target, 0);
  const allDone = hs.length > 0 && hs.every(h => valOf(h) >= h.target);

  mkSum(
    document.getElementById('qtsum'),
    tot, max,
    hs.filter(h => valOf(h) >= h.target).length, hs.length,
    allDone
  );

  const el = document.getElementById('qtl');
  el.innerHTML = '';

  hs.forEach(h => {
    const v    = valOf(h);
    const done = v >= h.target;
    const note = (Q.remarks && Q.remarks[h.id]) || '';
    const pct  = Math.min(100, Math.round(v / h.target * 100));
    const ctrl = h.link
      ? `<div class="cnt"><span class="cv">${v}<span class="ct">/${h.target}</span></span></div>`
      : `<div class="cnt"><button class="cb" data-qt="${h.id}" data-delta="-1">−</button><span class="cv">${v}<span class="ct">/${h.target}</span></span><button class="cb" data-qt="${h.id}" data-delta="1">+</button></div>`;
    const cap  = h.link ? `<div class="lcap">↗ fed by ${linkLabel(h.link)}</div>` : '';
    const pb   = `<div class="pw"><div class="pb"><div class="pf${done ? ' ok' : ''}" style="width:${pct}%"></div></div>${cap}</div>`;
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

function fillLinkSelect() {
  const sel = document.getElementById('fl-quarterly');
  if (!sel) return;
  const opts = linkSources('quarterly').map(o =>
    `<option value="${o.period}:${o.habitId}">${o.period} · ${o.label}</option>`).join('');
  sel.innerHTML = '<option value="">No link — manual counter</option>' + opts;
}
export function showAddForm()  {
  document.querySelectorAll('.ahfrm').forEach(f => f.classList.remove('on'));
  fillLinkSelect();
  const f = document.getElementById('af-quarterly');
  if (f) { f.classList.add('on'); setTimeout(() => f.querySelector('.fi')?.focus(), 30); }
}
export function closeAddForm() {
  const f = document.getElementById('af-quarterly');
  if (f) {
    f.classList.remove('on');
    const fi = f.querySelector('.fi'); if (fi) fi.value = '';
    const sel = document.getElementById('fl-quarterly'); if (sel) sel.value = '';
  }
}
export function addHabit() {
  const nameEl = document.getElementById('fn-quarterly');
  const name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { if (nameEl) nameEl.focus(); return; }
  const target  = parseInt(document.getElementById('ft-quarterly').value) || 1;
  const linkVal = document.getElementById('fl-quarterly')?.value || '';
  const goal    = { id: 'h' + Date.now(), label: name, target };
  if (linkVal) { const [period, habitId] = linkVal.split(':'); goal.link = { period, habitId }; }
  HABITS.quarterly.push(goal);
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
