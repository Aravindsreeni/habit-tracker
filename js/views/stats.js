// ── stats.js — Motivation: streaks (B5.1), heatmap (B5.2), stats + areas (B5.3) ──
// Reads the full daily history (ht_d_* keys) and rewards consistency.
// Positive reinforcement only — a broken streak is never shamed, it's an
// invitation to begin again.
import { HABITS, AREAS, setAreas, svAreas, svHabits, eachDailyLog } from '../store.js';
import { xSVG } from '../ui.js';
import { t, plural } from '../i18n.js';

// ── Compute helpers ──

function isDone(habit, value) {
  return habit.type === 'w'
    ? (typeof value === 'number' && value > 0)
    : value === true;
}

function dayNum(y, m, d) { return Math.floor(Date.UTC(y, m - 1, d) / 86400000); }
function ymdToNum(ymd)   { const [y, m, d] = ymd.split('-').map(Number); return dayNum(y, m, d); }
function todayNum() {
  const t_ = new Date();
  return dayNum(t_.getFullYear(), t_.getMonth() + 1, t_.getDate());
}

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

export function currentStreak(daySet) {
  let n = todayNum();
  if (!daySet.has(n)) n -= 1;
  let count = 0;
  while (daySet.has(n)) { count++; n--; }
  return count;
}

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

function numToYmd(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }

export function heatmapWeeks(daySet, weeks = 53) {
  const end = todayNum();
  const wd  = ((end % 7) + 3) % 7;
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

export function completionRate(daySet, windowDays) {
  const end = todayNum();
  let done = 0;
  for (let i = 0; i < windowDays; i++) if (daySet.has(end - i)) done++;
  return { done, total: windowDays, pct: Math.round(done / windowDays * 100) };
}

export function areaRate(areaId, habits, sets, windowDays) {
  const hs = habits.filter(h => h.area === areaId);
  let done = 0, total = 0;
  hs.forEach(h => {
    const r = completionRate(sets[h.id], windowDays);
    done += r.done; total += r.total;
  });
  return { count: hs.length, done, total, pct: total ? Math.round(done / total * 100) : 0 };
}

// ── Render ──

function days(n) {
  return `${n} ${plural(n, t('common.day_one'), t('common.day_other'))}`;
}

function streakMsg(cur, best) {
  if (cur === 0) {
    return best > 0
      ? t('stats.msg_begin', { n: days(best) })
      : t('stats.msg_first');
  }
  if (cur === best) return cur >= 2 ? t('stats.msg_best') : t('stats.msg_start');
  return t('stats.msg_keep');
}

export function render() {
  const el = document.getElementById('p-stats');
  if (!el) return;
  el.innerHTML = '';

  const habits = HABITS.daily || [];
  if (!habits.length) {
    el.appendChild(sectionHdr(t('stats.title'), '', '4px'));
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = t('stats.empty');
    el.appendChild(empty);
    return;
  }

  const sets = completedDaySets(habits);
  renderStreaks(el, habits, sets);
  renderStats(el, habits, sets);
  renderAreas(el, habits, sets);
  renderHeatmaps(el, habits, sets);
}

function sectionHdr(label, rightHTML = '', marginTop = '18px') {
  const hdr = document.createElement('div');
  hdr.className = 'sec-hdr';
  hdr.style.marginTop = marginTop;
  hdr.innerHTML = `<span class="sec-lbl">${label}</span>${rightHTML}`;
  return hdr;
}

// ── Streaks (B5.1) ──
function renderStreaks(el, habits, sets) {
  el.appendChild(sectionHdr(t('stats.section_streaks'), '', '4px'));
  const list = document.createElement('div');
  el.appendChild(list);
  habits.forEach(h => {
    const cur  = currentStreak(sets[h.id]);
    const best = longestStreak(sets[h.id]);
    const c = document.createElement('div');
    c.className = `hc st-card${cur > 0 ? ' on' : ''}`;
    c.innerHTML = `
      <div class="hr">
        <span class="hn">${esc(h.label)}</span>
        <span class="st-fire" title="${t('stats.cur_streak')}">${cur > 0 ? t('stats.fire_icon_on') : t('stats.fire_icon_off')} ${days(cur)}</span>
      </div>
      <div class="st-foot">
        <span class="st-best">${t('stats.best', { n: days(best) })}</span>
        <span class="st-msg">${streakMsg(cur, best)}</span>
      </div>`;
    list.appendChild(c);
  });
}

// ── Statistics (B5.3): completion rates over recent windows ──
function rateBar(label, r) {
  return `
    <div class="stt-row">
      <span class="stt-lbl">${label}</span>
      <div class="pb"><div class="pf${r.pct >= 70 ? ' ok' : ''}" style="width:${r.pct}%"></div></div>
      <span class="stt-val">${r.done}/${r.total}</span>
    </div>`;
}
function renderStats(el, habits, sets) {
  el.appendChild(sectionHdr(t('stats.section_consistency')));
  const list = document.createElement('div');
  el.appendChild(list);
  habits.forEach(h => {
    const r30 = completionRate(sets[h.id], 30);
    const r90 = completionRate(sets[h.id], 90);
    const c = document.createElement('div');
    c.className = 'hc stt-card';
    c.innerHTML = `
      <div class="hr">
        <span class="hn">${esc(h.label)}</span>
        <span class="stt-pct">${r30.pct}%<span class="stt-sub"> · 30d</span></span>
      </div>
      <div class="stt-bars">
        ${rateBar(t('stats.window_30'), r30)}
        ${rateBar(t('stats.window_90'), r90)}
      </div>`;
    list.appendChild(c);
  });
}

// ── Areas (B5.3): user-defined categories + grouped completion ──
function renderAreas(el, habits, sets) {
  el.appendChild(sectionHdr(t('stats.section_areas')));
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="area-add">
      <input class="fi" id="area-name" type="text" placeholder="${t('stats.area_ph')}" autocomplete="off">
      <button class="fsv" id="area-addbtn">${t('common.add')}</button>
    </div>
    <div id="area-list"></div>
    <div id="area-assign"></div>`;
  el.appendChild(wrap);

  _renderAreaList(habits, sets);
  _renderAreaAssign(habits);

  const nameEl = wrap.querySelector('#area-name');
  nameEl?.addEventListener('keydown', e => { if (e.key === 'Enter') _addArea(); });
  wrap.querySelector('#area-addbtn')?.addEventListener('click', _addArea);
}

function _renderAreaList(habits, sets) {
  const listEl = document.getElementById('area-list');
  if (!listEl) return;
  if (!AREAS.length) {
    listEl.innerHTML = `<div class="empty">${t('stats.no_areas')}</div>`;
    return;
  }
  listEl.innerHTML = '';
  AREAS.forEach(a => {
    const r = areaRate(a.id, habits, sets, 30);
    const habitWord = plural(r.count, t('stats.habit_one'), t('stats.habit_other'));
    const c = document.createElement('div');
    c.className = 'hc area-card';
    c.innerHTML = `
      <div class="hr">
        <span class="hn">${esc(a.name)}</span>
        <span class="area-meta">${r.count} ${habitWord}${r.count ? ` · ${t('stats.area_pct', { pct: r.pct })}` : ''}</span>
        <button class="hdel" title="${t('common.delete')}" data-area-del="${a.id}">${xSVG()}</button>
      </div>`;
    listEl.appendChild(c);
  });
  listEl.querySelectorAll('[data-area-del]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.areaDel;
      setAreas(AREAS.filter(a => a.id !== id));
      (HABITS.daily || []).forEach(h => { if (h.area === id) delete h.area; });
      svAreas(); svHabits(); render();
    };
  });
}

function _renderAreaAssign(habits) {
  const el = document.getElementById('area-assign');
  if (!el) return;
  if (!AREAS.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="area-assign-hdr">${t('stats.assign_title')}</div>`;
  habits.forEach(h => {
    const opts = [`<option value="">${t('common.none')}</option>`]
      .concat(AREAS.map(a => `<option value="${a.id}"${h.area === a.id ? ' selected' : ''}>${esc(a.name)}</option>`))
      .join('');
    const row = document.createElement('div');
    row.className = 'area-assign-row';
    row.innerHTML = `<span class="area-hn">${esc(h.label)}</span><select class="fse" data-assign="${h.id}">${opts}</select>`;
    el.appendChild(row);
  });
  el.querySelectorAll('[data-assign]').forEach(sel => {
    sel.onchange = () => {
      const h = (HABITS.daily || []).find(x => x.id === sel.dataset.assign);
      if (!h) return;
      if (sel.value) h.area = sel.value; else delete h.area;
      svHabits(); render();
    };
  });
}

function _addArea() {
  const inp = document.getElementById('area-name');
  const name = inp?.value.trim();
  if (!name) { inp?.focus(); return; }
  AREAS.push({ id: 'a' + Date.now(), name });
  svAreas();
  render();
  document.getElementById('area-name')?.focus();
}

// ── Heatmap (B5.2) ──
function renderHeatmaps(el, habits, sets) {
  const legend = `<span class="hm-legend">${t('stats.legend_less')} <i class="hm-cell"></i><i class="hm-cell on"></i> ${t('stats.legend_more')}</span>`;
  el.appendChild(sectionHdr(t('stats.section_heatmap'), legend));
  const hmList = document.createElement('div');
  el.appendChild(hmList);
  habits.forEach(h => renderHeatmapCard(hmList, h, sets[h.id]));
}

const HM_PITCH = 14;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function cellsGrid(weeks) {
  let html = '';
  weeks.forEach(col => col.forEach(cell => {
    if (!cell) { html += '<span class="hm-cell hm-pad"></span>'; return; }
    const tip = `${cell.ymd}${cell.on ? ' ' + t('stats.done_tooltip') : ''}`;
    html += `<span class="hm-cell${cell.on ? ' on' : ''}" title="${tip}"></span>`;
  }));
  return html;
}

function renderHeatmapCard(container, habit, daySet) {
  const weeks = heatmapWeeks(daySet);
  let count = 0;
  weeks.forEach(col => col.forEach(c => { if (c && c.on) count++; }));

  const countStr = `${count} ${plural(count, t('common.day_one'), t('common.day_other'))} · ${t('stats.hm_past_year')}`;
  const card = document.createElement('div');
  card.className = 'hc hm-card';
  card.innerHTML = `
    <div class="hr">
      <span class="hn">${esc(habit.label)}</span>
      <span class="hm-count">${countStr}</span>
    </div>
    <div class="hm-scroll">
      <div class="hm-months">${monthsRow(weeks)}</div>
      <div class="hm-grid">${cellsGrid(weeks)}</div>
    </div>`;
  container.appendChild(card);

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
