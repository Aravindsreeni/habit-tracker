// ── yearly.js — Yearly habits view ────────────────────────────────
import { HABITS, Y, sv, svHabits, yName, linkProgress, linkSources, linkLabel } from '../store.js';
import { mkCard, mkSum } from '../ui.js';
import { wireNotes, wireDel } from './notes.js';

const valOf = h => h.link ? linkProgress('yearly', h.link) : (Y[h.id] || 0);

export function render() {
  document.getElementById('yrlbl').textContent = yName();

  const hs      = HABITS.yearly || [];
  const tot     = hs.reduce((s, h) => s + Math.min(valOf(h), h.target), 0);
  const max     = hs.reduce((s, h) => s + h.target, 0);
  const allDone = hs.length > 0 && hs.every(h => valOf(h) >= h.target);

  mkSum(
    document.getElementById('yrsum'),
    tot, max,
    hs.filter(h => valOf(h) >= h.target).length, hs.length,
    allDone
  );

  const el = document.getElementById('yrl');
  el.innerHTML = '';

  hs.forEach(h => {
    const v    = valOf(h);
    const done = v >= h.target;
    const note = (Y.remarks && Y.remarks[h.id]) || '';
    const pct  = Math.min(100, Math.round(v / h.target * 100));
    const ctrl = h.link
      ? `<div class="cnt"><span class="cv">${v}<span class="ct">/${h.target}</span></span></div>`
      : `<div class="cnt"><button class="cb" data-yr="${h.id}" data-delta="-1">−</button><span class="cv">${v}<span class="ct">/${h.target}</span></span><button class="cb" data-yr="${h.id}" data-delta="1">+</button></div>`;
    const cap  = h.link ? `<div class="lcap">↗ fed by ${linkLabel(h.link)}</div>` : '';
    const pb   = `<div class="pw"><div class="pb"><div class="pf${done ? ' ok' : ''}" style="width:${pct}%"></div></div>${cap}</div>`;
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

function fillLinkSelect() {
  const sel = document.getElementById('fl-yearly');
  if (!sel) return;
  const opts = linkSources('yearly').map(o =>
    `<option value="${o.period}:${o.habitId}">${o.period} · ${o.label}</option>`).join('');
  sel.innerHTML = '<option value="">No link — manual counter</option>' + opts;
}
export function showAddForm()  {
  document.querySelectorAll('.ahfrm').forEach(f => f.classList.remove('on'));
  fillLinkSelect();
  const f = document.getElementById('af-yearly');
  if (f) { f.classList.add('on'); setTimeout(() => f.querySelector('.fi')?.focus(), 30); }
}
export function closeAddForm() {
  const f = document.getElementById('af-yearly');
  if (f) {
    f.classList.remove('on');
    const fi = f.querySelector('.fi'); if (fi) fi.value = '';
    const sel = document.getElementById('fl-yearly'); if (sel) sel.value = '';
  }
}
export function addHabit() {
  const nameEl = document.getElementById('fn-yearly');
  const name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { if (nameEl) nameEl.focus(); return; }
  const target  = parseInt(document.getElementById('ft-yearly').value) || 1;
  const linkVal = document.getElementById('fl-yearly')?.value || '';
  const goal    = { id: 'h' + Date.now(), label: name, target };
  if (linkVal) { const [period, habitId] = linkVal.split(':'); goal.link = { period, habitId }; }
  HABITS.yearly.push(goal);
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
