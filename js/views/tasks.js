// ── tasks.js — Smart Quick Wins view ──────────────────────────────
// Priority (High/Med/Low) × Effort → "win score" surfaces short high-pri tasks first.
import { QW, setQW, sv } from '../store.js';
import { ckSVG } from '../ui.js';

// Priority weights: lower = surfaces first
const PRI_W = { high: 0, med: 1, low: 2 };
const PRI_LABELS = { high: '🔴 High', med: '🟡 Med', low: '🟢 Low' };

let flt = 'all', qfo = false;

// win score: priority weight * 100 + effort (minutes)
function winScore(q) {
  const pw = PRI_W[q.priority || 'med'];
  return pw * 100 + parseInt(q.effort || 10);
}

export function render() {
  let list = [...QW];
  if      (flt === 'pending') list = list.filter(q => q.status === 'pending');
  else if (flt === 'done')    list = list.filter(q => q.status === 'done');

  // Sort: pending before done, then by win score (lower = better)
  list.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return winScore(a) - winScore(b);
  });

  const el = document.getElementById('ql');
  if (!el) return;
  el.innerHTML = '';

  if (!list.length) {
    el.innerHTML = `<div class="empty">${flt === 'done' ? 'No completed tasks yet' : 'No pending tasks — add one above'}</div>`;
    return;
  }

  list.forEach(q => {
    const done = q.status === 'done';
    const pri  = q.priority || 'med';
    const c = document.createElement('div');
    c.className = `qc${done ? ' dc' : ''}`;
    c.dataset.qid = q.id;
    c.innerHTML = `
      <span class="et pri-${pri}" title="Priority: ${pri}">${q.effort}m</span>
      <span class="qpri pri-dot-${pri}" title="${PRI_LABELS[pri]}"></span>
      <span class="qn">${q.task}</span>
      <button class="qk${done ? ' dn' : ''}" data-tq="${q.id}">${done ? ckSVG() : ''}</button>
      <button class="qdel" data-dq="${q.id}">×</button>`;
    el.appendChild(c);
  });

  el.querySelectorAll('[data-tq]').forEach(btn => {
    btn.onclick = () => {
      const q = QW.find(x => x.id === btn.dataset.tq);
      if (!q) return;
      q.status = q.status === 'done' ? 'pending' : 'done';
      sv('q'); render();
    };
  });
  el.querySelectorAll('[data-dq]').forEach(btn => {
    btn.onclick = () => {
      setQW(QW.filter(x => x.id !== btn.dataset.dq));
      sv('q'); render();
    };
  });
}

export function setFilter(f) {
  flt = f;
  document.querySelectorAll('.fb').forEach((b, i) =>
    b.classList.toggle('on', ['all', 'pending', 'done'][i] === f)
  );
  render();
}

export function toggleForm() {
  qfo = !qfo;
  document.getElementById('qaf').classList.toggle('on', qfo);
  if (qfo) setTimeout(() => document.getElementById('qfn').focus(), 30);
}

export function addTask() {
  const n   = document.getElementById('qfn').value.trim();
  const pri = document.getElementById('qfpri')?.value || 'med';
  if (!n) return;
  QW.push({
    id: 'q' + Date.now(),
    task: n,
    effort: document.getElementById('qfe').value,
    priority: pri,
    status: 'pending'
  });
  sv('q');
  document.getElementById('qfn').value = '';
  qfo = false;
  document.getElementById('qaf').classList.remove('on');
  render();
}

// Expose for inline HTML
window.sf  = setFilter;
window.tf  = toggleForm;
window.da  = addTask;
