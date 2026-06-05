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
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
