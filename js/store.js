// ── store.js — state, localStorage, schema migration, date keys ────

export const DEFAULT_HABITS = {
  daily: [
    { id: 'exercise',   label: 'Exercise',            type: 'c' },
    { id: 'breathMorn', label: 'Breathing — Morning', type: 'c' },
    { id: 'breathEve',  label: 'Breathing — Evening', type: 'c' },
    { id: 'water',      label: 'Drinking Water',      type: 'w', max: 8 }
  ],
  weekly: [
    { id: 'readBook',  label: 'Read few pages of book', target: 4 },
    { id: 'walk',      label: 'Go for a walk',          target: 3 },
    { id: 'cleanRoom', label: 'Clean room',             target: 3 }
  ],
  monthly: [
    { id: 'chapter', label: 'Complete chapter of book', target: 14 },
    { id: 'desk',    label: 'Arrange desk',             target: 2  },
    { id: 'hobby',   label: 'Try new hobby',            target: 5  }
  ],
  quarterly: [
    { id: 'books', label: 'Read 3 books',      target: 3 },
    { id: 'trip',  label: 'Plan a short trip', target: 1 }
  ],
  yearly: [
    { id: 'skill',   label: 'Learn a new skill',     target: 1 },
    { id: 'checkup', label: 'Annual health checkup', target: 1 }
  ]
};

export const DEFAULT_QW = () => [
  { id: 'q1', task: 'Call friend about bus availability', effort: '5',  status: 'pending' },
  { id: 'q2', task: 'Buy shampoo',                        effort: '10', status: 'pending' },
  { id: 'q3', task: 'Clean room',                         effort: '30', status: 'pending' },
  { id: 'q4', task: 'Read few pages',                     effort: '10', status: 'pending' }
];

// ── Mutable app state ──────────────────────────────────────────────
export let HABITS = {};
export let D = {}, W = {}, M = {}, Q = {}, Y = {}, QW = [];
export let INBOX = [];
export let ROUTINE = [];
export let AREAS = [];

export function setHabits(v)  { HABITS = v; }
export function setD(v)       { D = v; }
export function setW(v)       { W = v; }
export function setM(v)       { M = v; }
export function setQ(v)       { Q = v; }
export function setY(v)       { Y = v; }
export function setQW(v)      { QW = v; }
export function setInbox(v)   { INBOX = v; }
export function setRoutine(v) { ROUTINE = v; }
export function setAreas(v)   { AREAS = v; }

// ── localStorage helpers ───────────────────────────────────────────
export function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}
export function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) {}
}

// ── Date key helpers ───────────────────────────────────────────────
export function p2(n) { return String(n).padStart(2, '0'); }

export function dKey() {
  const d = new Date();
  return `ht_d_${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}
// Parameterized daily key for an arbitrary Date (for walking history backwards)
export function dKeyFor(date) {
  return `ht_d_${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`;
}
// Iterate every stored daily log: cb('YYYY-MM-DD', logObject). Used by stats.
export function eachDailyLog(cb) {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('ht_d_')) continue;
    cb(key.slice(5), lsGet(key) || {});
  }
}
// Journal (B6.1) — per-date entry { wins[], lows[], growth[] }, like daily logs.
export function jKey(date = new Date()) {
  return `ht_journal_${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`;
}
// Iterate every stored journal entry: cb('YYYY-MM-DD', entryObject).
export function eachJournal(cb) {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('ht_journal_')) continue;
    cb(key.slice(11), lsGet(key) || {});
  }
}
// Mood (B6.2) — per-date check-in { score, note }, like daily logs.
export function moodKey(date = new Date()) {
  return `ht_mood_${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`;
}
// Iterate every stored mood entry: cb('YYYY-MM-DD', entryObject).
export function eachMood(cb) {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('ht_mood_')) continue;
    cb(key.slice(8), lsGet(key) || {});
  }
}
export function wKey() {
  const d = new Date(), t = new Date(d);
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 4 - (t.getDay() || 7));
  const y = new Date(t.getFullYear(), 0, 1);
  return `ht_w_${t.getFullYear()}-W${p2(Math.ceil((((t - y) / 86400000) + 1) / 7))}`;
}
export function mKey() {
  const d = new Date();
  return `ht_m_${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
}
export function wRange() {
  const d = new Date(), day = d.getDay() || 7, m = new Date(d);
  m.setDate(d.getDate() - day + 1);
  const s = new Date(m); s.setDate(m.getDate() + 6);
  const f = x => x.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  return `${f(m)} – ${f(s)}`;
}
export function mName() {
  return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
export function qKey() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `ht_q_${d.getFullYear()}-Q${q}`;
}
export function yKey() {
  return `ht_y_${new Date().getFullYear()}`;
}
export function qName() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}
export function yName() {
  return String(new Date().getFullYear());
}

// ── Goal linking (B3.2): roll lower-period habit logs up into a goal ──
export const PERIOD_RANK = { daily: 0, weekly: 1, monthly: 2, quarterly: 3, yearly: 4 };

// Thursday of an ISO week — matches the Thursday-based week number in wKey()
function isoWeekThursday(year, week) {
  const jan4    = new Date(year, 0, 4);
  const jan4Dow = jan4.getDay() || 7;            // 1..7 (Mon..Sun)
  const mon1    = new Date(jan4);
  mon1.setDate(jan4.getDate() - jan4Dow + 1);    // Monday of ISO week 1
  const thu = new Date(mon1);
  thu.setDate(mon1.getDate() + (week - 1) * 7 + 3);
  return thu;
}
// Representative Date for a stored period-log key, used to bucket it into a parent period
function keyToDate(key, period) {
  const body = key.replace(/^ht_[a-z]_/, '');
  if (period === 'daily')     { const [y, m, d] = body.split('-').map(Number);  return new Date(y, m - 1, d); }
  if (period === 'weekly')    { const [y, w]    = body.split('-W').map(Number); return isoWeekThursday(y, w); }
  if (period === 'monthly')   { const [y, m]    = body.split('-').map(Number);  return new Date(y, m - 1, 1); }
  if (period === 'quarterly') { const [y, q]    = body.split('-Q').map(Number); return new Date(y, (q - 1) * 3, 1); }
  return null;
}
// [start, end) date range for the current quarter / year
export function quarterRange() {
  const d = new Date(), q = Math.floor(d.getMonth() / 3);
  return [new Date(d.getFullYear(), q * 3, 1), new Date(d.getFullYear(), q * 3 + 3, 1)];
}
export function yearRange() {
  const y = new Date().getFullYear();
  return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
}
// Sum a habit's logged values across all `period` logs whose date is within [start, end)
function sumLinked(period, habitId, start, end) {
  const prefix = { daily: 'ht_d_', weekly: 'ht_w_', monthly: 'ht_m_', quarterly: 'ht_q_' }[period];
  if (!prefix) return 0;
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    const date = keyToDate(key, period);
    if (!date || date < start || date >= end) continue;
    const v = (lsGet(key) || {})[habitId];
    if (typeof v === 'number') total += v;
    else if (v === true)       total += 1;
  }
  return total;
}
// Derived progress for a linked goal in the current parent period
export function linkProgress(parentPeriod, link) {
  if (!link || !link.period || !link.habitId) return 0;
  const [start, end] = parentPeriod === 'yearly' ? yearRange() : quarterRange();
  return sumLinked(link.period, link.habitId, start, end);
}
// Habits eligible to feed a goal of `parentPeriod` (strictly lower period rank)
export function linkSources(parentPeriod) {
  const rank = PERIOD_RANK[parentPeriod], out = [];
  ['daily', 'weekly', 'monthly', 'quarterly'].forEach(p => {
    if (PERIOD_RANK[p] >= rank) return;
    (HABITS[p] || []).forEach(h => out.push({ period: p, habitId: h.id, label: h.label }));
  });
  return out;
}
// Human caption for a goal's link, e.g. "Weekly · Go for a walk"
export function linkLabel(link) {
  if (!link || !link.period) return '';
  const cap = link.period.charAt(0).toUpperCase() + link.period.slice(1);
  const h = (HABITS[link.period] || []).find(x => x.id === link.habitId);
  return `${cap} · ${h ? h.label : link.habitId}`;
}

// ── Schema version + migration ─────────────────────────────────────
const SCHEMA_VERSION = 3;

// migrate() is idempotent and additive — it never deletes existing data.
// v1 → v2: ensure ht_habits has a `quarterly` and `yearly` array (for Phase 3);
//           ensure all period-log objects have a `remarks` map.
// v2 → v3: ensure ht_areas exists (habit categories, Phase 5.3).
function migrate(from) {
  // v1 → v2
  if (from < 2) {
    const h = lsGet('ht_habits');
    if (h) {
      if (!Array.isArray(h.quarterly)) h.quarterly = [];
      if (!Array.isArray(h.yearly))    h.yearly    = [];
      lsSet('ht_habits', h);
    }
    // Ensure `remarks` exists in all stored period logs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (/^ht_(d|w|m)_/.test(key)) {
        const val = lsGet(key);
        if (val && typeof val === 'object' && !val.remarks) {
          val.remarks = {};
          lsSet(key, val);
        }
      }
    }
  }
  // v2 → v3
  if (from < 3) {
    if (!Array.isArray(lsGet('ht_areas'))) lsSet('ht_areas', []);
  }
  lsSet('ht_schema_version', SCHEMA_VERSION);
}

export function initSchema() {
  const v = lsGet('ht_schema_version') || 1;
  if (v < SCHEMA_VERSION) migrate(v);
}

// ── Load & save ────────────────────────────────────────────────────
export function loadAll() {
  HABITS = lsGet('ht_habits') || JSON.parse(JSON.stringify(DEFAULT_HABITS));
  D = lsGet(dKey()) || {};  if (!D.remarks)  D.remarks  = {};
  W = lsGet(wKey()) || {};  if (!W.remarks)  W.remarks  = {};
  M = lsGet(mKey()) || {};  if (!M.remarks)  M.remarks  = {};
  Q = lsGet(qKey()) || {};  if (!Q.remarks)  Q.remarks  = {};
  Y = lsGet(yKey()) || {};  if (!Y.remarks)  Y.remarks  = {};
  QW      = lsGet('ht_qw')      || DEFAULT_QW();
  INBOX   = lsGet('ht_inbox')   || [];
  ROUTINE = lsGet('ht_routine') || [];
  AREAS   = lsGet('ht_areas')   || [];

  const lastSync = lsGet('ht_lastsync');
  const el = document.getElementById('syncinfo');
  if (el) {
    el.innerHTML = lastSync
      ? `<b>Last synced:</b> ${lastSync}`
      : `Sync to Google Drive to access your habits from any device.`;
  }
}

// svInbox: called after mutating INBOX
export function svInbox() {
  lsSet('ht_inbox', INBOX);
  import('./sync.js').then(m => m.scheduleSync()).catch(() => {});
}

// svRoutine: called after mutating ROUTINE
export function svRoutine() {
  lsSet('ht_routine', ROUTINE);
  import('./sync.js').then(m => m.scheduleSync()).catch(() => {});
}

// svAreas: called after mutating AREAS (add/delete category)
export function svAreas() {
  lsSet('ht_areas', AREAS);
  import('./sync.js').then(m => m.scheduleSync()).catch(() => {});
}

// svJournal: save one date's journal entry, keyed by 'YYYY-MM-DD'.
export function svJournal(ymd, entry) {
  lsSet('ht_journal_' + ymd, entry);
  import('./sync.js').then(m => m.scheduleSync()).catch(() => {});
}

// svMood: save one date's mood check-in, keyed by 'YYYY-MM-DD'.
export function svMood(ymd, entry) {
  lsSet('ht_mood_' + ymd, entry);
  import('./sync.js').then(m => m.scheduleSync()).catch(() => {});
}

// svHabits: called after mutating HABITS (add/delete)
export function svHabits() {
  lsSet('ht_habits', HABITS);
  import('./sync.js').then(m => m.scheduleSync()).catch(() => {});
}

// sv: called by views after mutating state; key = section name or short code
export function sv(section) {
  if      (section === 'd'   || section === 'daily')     lsSet(dKey(),   D);
  else if (section === 'w'   || section === 'weekly')    lsSet(wKey(),   W);
  else if (section === 'm'   || section === 'monthly')   lsSet(mKey(),   M);
  else if (section === 'qt'  || section === 'quarterly') lsSet(qKey(),   Q);
  else if (section === 'y'   || section === 'yearly')    lsSet(yKey(),   Y);
  else if (section === 'q'   || section === 'wins')      lsSet('ht_qw',  QW);
  import('./sync.js').then(m => m.scheduleSync()).catch(() => {});
}
