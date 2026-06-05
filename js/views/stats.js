// ── stats.js — Motivation: streaks (B5.1), heatmap (B5.2), stats (B5.3) ──
// Reads the full daily history (ht_d_* keys) and rewards consistency.
// Positive reinforcement only — a broken streak is never shamed, it's an
// invitation to begin again.
import { HABITS, eachDailyLog } from '../store.js';

// ── Compute helpers (kept separate from render so later batches reuse them) ──

// A daily habit counts as "done" on a day if its checkbox is true, or its
// counter is > 0. `h.type === 'w'` is a counter; anything else is a checkbox.
function isDone(habit, value) {
  return habit.type === 'w'
    ? (typeof value === 'number' && value > 0)
    : value === true;
}

// Whole-day number (days since epoch, UTC) — DST-safe for streak arithmetic.
function dayNum(y, m, d) { return Math.floor(Date.UTC(y, m - 1, d) / 86400000); }
function ymdToNum(ymd)   { const [y, m, d] = ymd.split('-').map(Number); return dayNum(y, m, d); }
function todayNum() {
  const t = new Date();
  return dayNum(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

// Build { habitId: Set<dayNum> } of completed days, in a single pass over history.
export function completedDaySets(habits) {
  const sets = {};
  habits.forEach(h => { sets[h.id] = new Set(); });
  eachDailyLog((ymd, log) => {
    habits.forEach(h => {
      if (isDone(h, log[h.id])) sets[h.id].add(ymdToNum(ymd));
    });
  });
  return sets;
}

// Consecutive days up to today. Today not being logged yet does NOT break it —
// we count the run ending at today, or at yesterday if today is still blank.
export function currentStreak(daySet) {
  let n = todayNum();
  if (!daySet.has(n)) n -= 1;
  let count = 0;
  while (daySet.has(n)) { count++; n--; }
  return count;
}

// Longest consecutive run anywhere in the history.
export function longestStreak(daySet) {
  const nums = [...daySet].sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const n of nums) {
    run = (prev !== null && n === prev + 1) ? run + 1 : 1;
    if (run > best) best = run;
    prev = n;
  }
  return best;
}

// dayNum → 'YYYY-MM-DD' (UTC, matching how dayNum was built).
function numToYmd(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }

// GitHub-style year grid for a daySet: an array of week-columns, each a length-7
// array (rows = Mon..Sun) of { n, ymd, on } cells, or null for future padding.
// The last column is the current week; today is its newest non-null cell.
export function heatmapWeeks(daySet, weeks = 53) {
  const end = todayNum();
  const wd  = ((end % 7) + 3) % 7;            // weekday of today, Mon=0 (epoch=Thu)
  const firstMonday = (end - wd) - (weeks - 1) * 7;
  const cols = [];
  for (let c = 0; c < weeks; c++) {
    const col = [];
    for (let r = 0; r < 7; r++) {
      const n = firstMonday + c * 7 + r;
      col.push(n > end ? null : { n, ymd: numToYmd(n), on: daySet.has(n) });
    }
    cols.push(col);
  }
  return cols;
}

// ── Render ──────────────────────────────────────────────────────────

function days(n) { return `${n} ${n === 1 ? 'day' : 'days'}`; }

// Encouraging, never-shaming caption for a streak.
function streakMsg(cur, best) {
  if (cur === 0) {
    return best > 0
      ? `You hit ${days(best)} once — begin again 🌱`
      : 'Every streak starts with day one 🌱';
  }
  if (cur === best) return cur >= 2 ? 'Best yet! 🎉' : 'Off to a great start ✨';
  return 'Keep it going 💪';
}

export function render() {
  const el = document.getElementById('p-stats');
  if (!el) return;

  const habits = HABITS.daily || [];

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">Streaks · Daily habits</span>
    </div>
    <div id="st-list"></div>`;

  const list = el.querySelector('#st-list');
  if (!habits.length) {
    list.innerHTML = '<div class="empty">Add a daily habit to start building streaks</div>';
    return;
  }

  const sets = completedDaySets(habits);
  habits.forEach(h => {
    const cur  = currentStreak(sets[h.id]);
    const best = longestStreak(sets[h.id]);
    const c = document.createElement('div');
    c.className = `hc st-card${cur > 0 ? ' on' : ''}`;
    c.innerHTML = `
      <div class="hr">
        <span class="hn">${esc(h.label)}</span>
        <span class="st-fire" title="Current streak">${cur > 0 ? '🔥' : '🌱'} ${days(cur)}</span>
      </div>
      <div class="st-foot">
        <span class="st-best">Best · ${days(best)}</span>
        <span class="st-msg">${streakMsg(cur, best)}</span>
      </div>`;
    list.appendChild(c);
  });

  // ── Heatmap section (B5.2) ──
  const hdr = document.createElement('div');
  hdr.className = 'sec-hdr';
  hdr.style.marginTop = '18px';
  hdr.innerHTML = `
    <span class="sec-lbl">Heatmap · Past year</span>
    <span class="hm-legend">Less <i class="hm-cell"></i><i class="hm-cell on"></i> More</span>`;
  el.appendChild(hdr);

  const hmList = document.createElement('div');
  el.appendChild(hmList);
  habits.forEach(h => renderHeatmapCard(hmList, h, sets[h.id]));
}

// Pitch (px) of one heatmap column = cell width + grid gap (keep in sync with CSS).
const HM_PITCH = 14;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Month-label strip above the grid; label shown only for runs wide enough to fit.
function monthsRow(weeks) {
  const groups = [];
  weeks.forEach(col => {
    const first = col.find(c => c);
    const m = first ? new Date(first.n * 86400000).getUTCMonth() : -1;
    const last = groups[groups.length - 1];
    if (last && last.month === m) last.count++;
    else groups.push({ month: m, count: 1 });
  });
  return groups.map(g =>
    `<span style="width:${g.count * HM_PITCH}px">${g.count >= 2 && g.month >= 0 ? MON[g.month] : ''}</span>`
  ).join('');
}

// Cells in column-major order to match the grid's grid-auto-flow: column.
function cellsGrid(weeks) {
  let html = '';
  weeks.forEach(col => col.forEach(cell => {
    if (!cell) { html += '<span class="hm-cell hm-pad"></span>'; return; }
    html += `<span class="hm-cell${cell.on ? ' on' : ''}" title="${cell.ymd}${cell.on ? ' · done ✓' : ''}"></span>`;
  }));
  return html;
}

function renderHeatmapCard(container, habit, daySet) {
  const weeks = heatmapWeeks(daySet);
  let count = 0;
  weeks.forEach(col => col.forEach(c => { if (c && c.on) count++; }));

  const card = document.createElement('div');
  card.className = 'hc hm-card';
  card.innerHTML = `
    <div class="hr">
      <span class="hn">${esc(habit.label)}</span>
      <span class="hm-count">${count} ${count === 1 ? 'day' : 'days'} · past year</span>
    </div>
    <div class="hm-scroll">
      <div class="hm-months">${monthsRow(weeks)}</div>
      <div class="hm-grid">${cellsGrid(weeks)}</div>
    </div>`;
  container.appendChild(card);

  // Default the scroll to the most recent weeks (today is on the right edge).
  const sc = card.querySelector('.hm-scroll');
  if (sc) sc.scrollLeft = sc.scrollWidth;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
