// ── mood.js — Daily Mood check-in (B6.2) ──────────────────────────
// A low-friction daily mood log (one tap) plus an optional note and a short
// 14-day trend. Mood tracking builds self-awareness and helps surface patterns;
// it is non-judgemental — there is no "good" or "bad" score to chase.
// Self-help tool, NOT a substitute for professional care (disclaimer below).
import { moodKey, eachMood, svMood, lsGet, p2 } from '../store.js';
import { t } from '../i18n.js';

// 5-point scale, 1 (rough) … 5 (great). Emoji is universal; only labels are translated.
const SCALE_EMOJIS = ['😞', '😕', '😐', '🙂', '😄'];
const TREND_DAYS = 14;

function _scale() {
  return SCALE_EMOJIS.map((emoji, i) => ({
    score: i + 1,
    emoji,
    label: t(`mood.label_${i + 1}`),
  }));
}

// ── Pure logic (node-tested) ──
export function normalizeMood(raw) {
  const out = { score: 0, note: '' };
  if (!raw || typeof raw !== 'object') return out;
  if (typeof raw.score === 'number' && raw.score >= 1 && raw.score <= 5) {
    out.score = Math.round(raw.score);
  }
  if (typeof raw.note === 'string') out.note = raw.note;
  return out;
}

export function avgScore(scores) {
  const v = scores.filter(s => typeof s === 'number' && s >= 1 && s <= 5);
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

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

  const SCALE = _scale();
  const entry = normalizeMood(lsGet(moodKey()));
  const picked = SCALE.find(s => s.score === entry.score);

  const hdr = picked
    ? t('mood.header_scored', { label: picked.label })
    : t('mood.header_base');

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">${hdr}</span>
    </div>
    <div class="md-intro">${t('mood.intro')}</div>
    <div class="md-scale">${SCALE.map(s => faceBtn(s, entry.score)).join('')}</div>
    <textarea class="rta md-note" id="md-note" maxlength="500"
      placeholder="${t('mood.note_ph')}">${esc(entry.note)}</textarea>
    <div class="sec-hdr" style="margin-top:20px"><span class="sec-lbl">${t('mood.trend_header', { n: TREND_DAYS })}</span></div>
    <div id="md-trend"></div>
    <div class="jr-disc">${t('mood.disclaimer')}</div>`;

  _wire(SCALE);
  _renderTrend(SCALE);
}

function faceBtn(s, selected) {
  return `
    <button class="md-face${selected === s.score ? ' on' : ''}" data-md="${s.score}" title="${s.label}">
      <span class="md-emoji">${s.emoji}</span>
      <span class="md-lbl">${s.label}</span>
    </button>`;
}

function _wire(SCALE) {
  document.querySelectorAll('[data-md]').forEach(btn => {
    btn.onclick = () => _setScore(+btn.dataset.md, SCALE);
  });
  const note = document.getElementById('md-note');
  if (note) note.onblur = () => {
    const entry = normalizeMood(lsGet(moodKey()));
    entry.note = note.value;
    svMood(todayYmd(), entry);
  };
}

function _setScore(score, SCALE) {
  const entry = normalizeMood(lsGet(moodKey()));
  const note = document.getElementById('md-note');
  if (note) entry.note = note.value;
  entry.score = entry.score === score ? 0 : score;
  svMood(todayYmd(), entry);
  render();
}

// ── Trend (last 14 days) ──
function _renderTrend(SCALE) {
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
        <span class="md-trend-avg">${avg !== null ? avg.toFixed(1) : '—'}<span class="md-trend-sub"> ${t('mood.trend_avg_suffix')}</span></span>
        <span class="md-trend-cnt">${t('mood.trend_logged', { logged: logged.length, total: TREND_DAYS })}</span>
      </div>
      <div class="md-bars">${bars}</div>
      <div class="md-trend-msg">${trendMsg(avg, logged.length)}</div>
    </div>`;
}

function trendMsg(avg, count) {
  if (!count)                          return t('mood.trend_none');
  if (avg !== null && avg <= 2)        return t('mood.trend_low');
  if (avg !== null && avg >= 4)        return t('mood.trend_high');
  return t('mood.trend_mid');
}

function fmtDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
