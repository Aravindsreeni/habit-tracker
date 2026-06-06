// ── journal.js — Daily Journal (B6.1) ─────────────────────────────
// "Three Good Things" / What-Went-Well-and-Why (Seligman et al. 2005 RCT):
// writing what went well — and *why* — reliably raises happiness and lowers
// depressive symptoms for months. Positive-first; entries stay private on
// this device. This is a self-help tool, NOT a substitute for professional care.
import { jKey, eachJournal, svJournal, lsGet, p2 } from '../store.js';
import { xSVG } from '../ui.js';

// Gentle 10:1:2 caps — keep the focus on the positive (lots of wins, few lows).
const SECTIONS = [
  { key: 'wins',   max: 10, emoji: '🌟', title: 'What went well — and why?',
    ph: 'Something good that happened, and why it happened…',
    hint: 'The heart of the practice — name the good, then the cause.' },
  { key: 'lows',   max: 1,  emoji: '🌧️', title: 'One hard thing (optional)',
    ph: 'Name it gently — just once…',
    hint: 'Acknowledge it, then let it rest.' },
  { key: 'growth', max: 2,  emoji: '🌱', title: 'What might I learn or try next?',
    ph: 'A small step or insight for tomorrow…',
    hint: '' }
];

// ── Pure logic (node-tested) ──
// Normalise any stored shape into { wins:[], lows:[], growth:[] } of trimmed
// strings — tolerant of the legacy single-string shape and of missing keys.
export function normalize(raw) {
  const out = { wins: [], lows: [], growth: [] };
  if (!raw || typeof raw !== 'object') return out;
  for (const k of ['wins', 'lows', 'growth']) {
    const v = raw[k];
    if (Array.isArray(v)) {
      out[k] = v.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim());
    } else if (typeof v === 'string' && v.trim()) {
      out[k] = [v.trim()];
    }
  }
  return out;
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

// ── Render ──
export function render() {
  const el = document.getElementById('p-journal');
  if (!el) return;

  const entry = normalize(lsGet(jKey()));
  const total = entry.wins.length + entry.lows.length + entry.growth.length;

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">Journal · Today${total ? ` · ${total}` : ''}</span>
    </div>
    <div class="jr-intro">A few honest lines on what went well — and <i>why</i> — gently lifts mood over time.</div>
    <div id="jr-today"></div>
    <div class="sec-hdr" style="margin-top:20px"><span class="sec-lbl">Past days</span></div>
    <div id="jr-history"></div>
    ${disclaimerHTML()}`;

  _renderToday(entry);
  _renderHistory();
}

function _renderToday(entry) {
  const host = document.getElementById('jr-today');
  if (!host) return;
  host.innerHTML = '';
  SECTIONS.forEach(sec => host.appendChild(_sectionCard(sec, entry[sec.key])));
}

function _sectionCard(sec, items) {
  const full = items.length >= sec.max;
  const card = document.createElement('div');
  card.className = 'hc jr-card';
  card.innerHTML = `
    <div class="jr-sec-hdr">
      <span class="jr-sec-title">${sec.emoji} ${sec.title}</span>
      <span class="jr-sec-count">${items.length}/${sec.max}</span>
    </div>
    ${sec.hint ? `<div class="jr-hint">${sec.hint}</div>` : ''}
    <div class="jr-items">${
      items.length
        ? items.map((t, i) => itemRow(sec.key, i, t)).join('')
        : '<div class="jr-blank">Nothing here yet — add when you\'re ready</div>'
    }</div>
    ${full
      ? `<div class="jr-full">That's plenty for today ✓</div>`
      : `<div class="jr-add">
           <input class="fi" id="jr-inp-${sec.key}" type="text" placeholder="${esc(sec.ph)}" autocomplete="off" maxlength="280">
           <button class="fsv" data-jr-add="${sec.key}">Add</button>
         </div>`}`;

  card.querySelector('[data-jr-add]')?.addEventListener('click', () => _add(sec.key));
  card.querySelector(`#jr-inp-${sec.key}`)
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') _add(sec.key); });
  card.querySelectorAll('[data-jr-del]').forEach(btn => {
    btn.onclick = () => {
      const [k, idx] = btn.dataset.jrDel.split(':');
      _del(k, +idx);
    };
  });
  return card;
}

function itemRow(key, i, text) {
  return `
    <div class="jr-item">
      <span class="jr-bull">•</span>
      <span class="jr-text">${esc(text)}</span>
      <button class="hdel" title="Remove" data-jr-del="${key}:${i}">${xSVG()}</button>
    </div>`;
}

function _add(key) {
  const sec = SECTIONS.find(s => s.key === key);
  const inp = document.getElementById(`jr-inp-${key}`);
  const text = inp?.value.trim();
  if (!text) { inp?.focus(); return; }
  const entry = normalize(lsGet(jKey()));
  if (entry[key].length >= sec.max) return;   // respect the gentle cap
  entry[key].push(text);
  svJournal(todayYmd(), entry);
  render();
  document.getElementById(`jr-inp-${key}`)?.focus();
}

function _del(key, i) {
  const entry = normalize(lsGet(jKey()));
  entry[key].splice(i, 1);
  svJournal(todayYmd(), entry);
  render();
}

// ── History (past days, read-only, tap to expand) ──
let openDay = null;

function _renderHistory() {
  const host = document.getElementById('jr-history');
  if (!host) return;
  const today = todayYmd();
  const rows = [];
  eachJournal((ymd, raw) => {
    if (ymd === today) return;
    const e = normalize(raw);
    const n = e.wins.length + e.lows.length + e.growth.length;
    if (n) rows.push({ ymd, e });
  });
  rows.sort((a, b) => b.ymd.localeCompare(a.ymd));

  if (!rows.length) {
    host.innerHTML = '<div class="empty">Past reflections will appear here</div>';
    return;
  }
  host.innerHTML = '';
  rows.forEach(r => host.appendChild(_historyCard(r)));
}

function _historyCard({ ymd, e }) {
  const open = openDay === ymd;
  const meta = `🌟 ${e.wins.length}`
    + (e.lows.length   ? ` · 🌧️ ${e.lows.length}`   : '')
    + (e.growth.length ? ` · 🌱 ${e.growth.length}` : '');
  const c = document.createElement('div');
  c.className = `hc jr-hist${open ? ' on' : ''}`;
  c.innerHTML = `
    <div class="hr jr-hist-hdr" data-jr-day="${ymd}">
      <span class="hn">${fmtDate(ymd)}</span>
      <span class="jr-hist-meta">${meta}</span>
      <span class="jr-caret">${open ? '▾' : '▸'}</span>
    </div>
    ${open ? `<div class="jr-hist-body">${histBody(e)}</div>` : ''}`;
  c.querySelector('[data-jr-day]')?.addEventListener('click', () => {
    openDay = open ? null : ymd;
    _renderHistory();
  });
  return c;
}

function histBody(e) {
  return SECTIONS.map(sec => {
    const items = e[sec.key];
    if (!items.length) return '';
    return `
      <div class="jr-hist-sec">
        <div class="jr-hist-lbl">${sec.emoji} ${sec.title}</div>
        ${items.map(t => `<div class="jr-hist-item">${esc(t)}</div>`).join('')}
      </div>`;
  }).join('') || '<div class="jr-blank">No entries</div>';
}

function fmtDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

// Design principle 5: self-help disclaimer + crisis-resource pointer, always visible.
function disclaimerHTML() {
  return `
    <div class="jr-disc">
      <b>A self-help tool, not a substitute for professional care.</b>
      Journaling supports wellbeing but isn't therapy. If you're struggling or in
      crisis, please reach out — e.g. <b>Tele-MANAS 14416</b> (India, 24×7) or your
      local emergency number. Your entries stay private on this device.
    </div>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
