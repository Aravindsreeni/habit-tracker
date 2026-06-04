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
export let D = {}, W = {}, M = {}, QW = [];
export let INBOX = [];

export function setHabits(v) { HABITS = v; }
export function setD(v)      { D = v; }
export function setW(v)      { W = v; }
export function setM(v)      { M = v; }
export function setQW(v)     { QW = v; }
export function setInbox(v)  { INBOX = v; }

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

// ── Schema version + migration ─────────────────────────────────────
const SCHEMA_VERSION = 2;

// migrate() is idempotent and additive — it never deletes existing data.
// v1 → v2: ensure ht_habits has a `quarterly` and `yearly` array (for Phase 3);
//           ensure all period-log objects have a `remarks` map.
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
  QW    = lsGet('ht_qw')    || DEFAULT_QW();
  INBOX = lsGet('ht_inbox') || [];

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

// svHabits: called after mutating HABITS (add/delete)
export function svHabits() {
  lsSet('ht_habits', HABITS);
  import('./sync.js').then(m => m.scheduleSync()).catch(() => {});
}

// sv: called by views after mutating state; key = 'd'|'w'|'m'|'q' or section name
export function sv(section) {
  if      (section === 'd' || section === 'daily')   lsSet(dKey(),   D);
  else if (section === 'w' || section === 'weekly')  lsSet(wKey(),   W);
  else if (section === 'm' || section === 'monthly') lsSet(mKey(),   M);
  else if (section === 'q' || section === 'wins')    lsSet('ht_qw',  QW);
  import('./sync.js').then(m => m.scheduleSync()).catch(() => {});
}
