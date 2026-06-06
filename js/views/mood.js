// ── mood.js — Daily Mood check-in (B6.2) ──────────────────────────
// A low-friction daily mood log (one tap) plus an optional note and a short
// 14-day trend. Mood tracking builds self-awareness and helps surface patterns;
// it is non-judgemental — there is no "good" or "bad" score to chase.
// Self-help tool, NOT a substitute for professional care (disclaimer below).
import { moodKey, eachMood, svMood, lsGet, p2 } from '../store.js';

// 5-point scale, 1 (rough) … 5 (great).
const SCALE = [
  { score: 1, emoji: '😞', label: 'Rough' },
  { score: 2, emoji: '😕', label: 'Low'   },
  { score: 3, emoji: '😐', label: 'Okay'  },
  { score: 4, emoji: '🙂', label: 'Good'  },
  { score: 5, emoji: '😄', label: 'Great' }
];
const TREND_DAYS = 14;

// ── Pure logic (node-tested) ──
// Normalise any stored shape into { score:0..5, note:'' }. score 0 = not set.
export function normalizeMood(raw) {
  const out = { score: 0, note: '' };
  if (!raw || typeof raw !== 'object') return out;
  if (typeof raw.score === 'number' && raw.score >= 1 && raw.score <= 5) {
    out.score = Math.round(raw.score);
  }
  if (typeof raw.note === 'string') out.note = raw.note;
  return out;
}

// Mean of the valid (1..5) scores, or null if none. Pure.
export function avgScore(scores) {
  const v = scores.filter(s => typeof s === 'number' && s >= 1 && s <= 5);
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

// The last `n` calendar dates ending at `todayYmd`, oldest → newest, as
// 'YYYY-MM-DD'. UTC arithmetic keeps it DST-safe. Pure.
export function lastNDates(todayYmd, n) {
  const [y, m, d] = todayYmd.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(base - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

// ── Render ──
export function render() {
  const el = document.getElementById('p-mood');
  if (!el) return;

  const entry = normalizeMood(lsGet(moodKey()));
  const picked = SCALE.find(s => s.score === entry.score);

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">Mood · Today${picked ? ` · ${picked.label}` : ''}</span>
    </div>
    <div class="md-intro">How are you feeling right now? One tap — there's no wrong answer.</div>
    <div class="md-scale">${SCALE.map(s => faceBtn(s, entry.score)).join('')}</div>
    <textarea class="rta md-note" id="md-note" maxlength="500"
      placeholder="Anything you want to note about today? (optional)">${esc(entry.note)}</textarea>
    <div class="sec-hdr" style="margin-top:20px"><span class="sec-lbl">Last ${TREND_DAYS} days</span></div>
    <div id="md-trend"></div>
    ${disclaimerHTML()}`;

  _wire();
  _renderTrend();
}

function faceBtn(s, selected) {
  return `
    <button class="md-face${selected === s.score ? ' on' : ''}" data-md="${s.score}" title="${s.label}">
      <span class="md-emoji">${s.emoji}</span>
      <span class="md-lbl">${s.label}</span>
    </button>`;
}

function _wire() {
  document.querySelectorAll('[data-md]').forEach(btn => {
    btn.onclick = () => _setScore(+btn.dataset.md);
  });
  const note = document.getElementById('md-note');
  if (note) note.onblur = () => {
    const entry = normalizeMood(lsGet(moodKey()));
    entry.note = note.value;
    svMood(todayYmd(), entry);
  };
}

function _setScore(score) {
  const entry = normalizeMood(lsGet(moodKey()));
  const note = document.getElementById('md-note');
  if (note) entry.note = note.value;                    // keep any typed note
  entry.score = entry.score === score ? 0 : score;      // tap again to clear
  svMood(todayYmd(), entry);
  render();
}

// ── Trend (last 14 days) ──
function _renderTrend() {
  const host = document.getElementById('md-trend');
  if (!host) return;

  const byDate = {};
  eachMood((ymd, raw) => { byDate[ymd] = normalizeMood(raw); });

  const dates  = lastNDates(todayYmd(), TREND_DAYS);
  const scores = dates.map(d => (byDate[d] && byDate[d].score) || 0);
  const logged = scores.filter(s => s >= 1);
  const avg    = avgScore(scores);

  const bars = dates.map((d, i) => {
    const sc = scores[i];
    const lbl = sc ? SCALE.find(x => x.score === sc).label : '—';
    return `
      <div class="md-bar-wrap" title="${fmtDate(d)} · ${lbl}">
        <div class="md-bar${sc ? ` s${sc}` : ' none'}" style="height:${sc ? sc / 5 * 100 : 8}%"></div>
      </div>`;
  }).join('');

  host.innerHTML = `
    <div class="hc md-trend-card">
      <div class="md-trend-top">
        <span class="md-trend-avg">${avg !== null ? avg.toFixed(1) : '—'}<span class="md-trend-sub"> avg</span></span>
        <span class="md-trend-cnt">${logged.length}/${TREND_DAYS} days logged</span>
      </div>
      <div class="md-bars">${bars}</div>
      <div class="md-trend-msg">${trendMsg(avg, logged.length)}</div>
    </div>`;
}

// Gentle, non-judgemental caption — supportive on hard stretches, never shaming.
function trendMsg(avg, count) {
  if (!count) return 'Check in daily to start seeing your mood trend. 🌱';
  if (avg !== null && avg <= 2) {
    return 'Some heavy days lately — be gentle with yourself. Support is below if you need it. 💛';
  }
  if (avg !== null && avg >= 4) return 'A brighter stretch — good to see. ✨';
  return 'Thanks for checking in — noticing is the first step. 🌱';
}

function fmtDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

// Design principle 5: self-help disclaimer + crisis-resource pointer, always visible.
function disclaimerHTML() {
  return `
    <div class="jr-disc">
      <b>A self-help tool, not a substitute for professional care.</b>
      Mood tracking builds awareness but isn't a diagnosis. If you're struggling or
      in crisis, please reach out — e.g. <b>Tele-MANAS 14416</b> (India, 24×7) or your
      local emergency number. Your check-ins stay private on this device.
    </div>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
