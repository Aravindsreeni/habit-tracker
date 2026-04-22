// ─────────────────────────────────────────────────────────────────
// FILL IN YOUR GOOGLE OAUTH CLIENT ID BEFORE UPLOADING TO GITHUB.
// Get it from: console.cloud.google.com → Your project
//   → APIs & Services → Credentials → OAuth 2.0 Client ID
// ─────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = '18794991368-45hja4sdkilvcmbi4k50cnqmb9b2plm1.apps.googleusercontent.com';
// ─────────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════

const ckSVG  = () => `<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const penSVG = () => `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 9.5V11H3.5L9.5 5L8 3.5L2 9.5Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/><path d="M8 3.5L9.5 2L11 3.5L9.5 5L8 3.5Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/></svg>`;
const xSVG   = () => `<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 1.5L7.5 7.5M7.5 1.5L1.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;


// ══════════════════════════════════════════════════════════════════
// DEFAULT DATA
// ══════════════════════════════════════════════════════════════════

const DEFAULT_HABITS = {
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

const DEFAULT_QW = () => [
  { id: 'q1', task: 'Call friend about bus availability', effort: '5',  status: 'pending' },
  { id: 'q2', task: 'Buy shampoo',                        effort: '10', status: 'pending' },
  { id: 'q3', task: 'Clean room',                         effort: '30', status: 'pending' },
  { id: 'q4', task: 'Read few pages',                     effort: '10', status: 'pending' }
];


// ══════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════

let HABITS = {};
let D = {}, W = {}, M = {}, QW = [];
let flt = 'all', qfo = false;
let gAccessToken = null, tokenClient = null, afterAuth = null, syncTimer = null;


// ══════════════════════════════════════════════════════════════════
// LOCAL STORAGE HELPERS
// ══════════════════════════════════════════════════════════════════

function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) {}
}


// ══════════════════════════════════════════════════════════════════
// DATE KEY HELPERS
// ══════════════════════════════════════════════════════════════════

function p2(n) { return String(n).padStart(2, '0'); }

function dKey() {
  const d = new Date();
  return `ht_d_${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}
function wKey() {
  const d = new Date(), t = new Date(d);
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 4 - (t.getDay() || 7));
  const y = new Date(t.getFullYear(), 0, 1);
  return `ht_w_${t.getFullYear()}-W${p2(Math.ceil((((t - y) / 86400000) + 1) / 7))}`;
}
function mKey() {
  const d = new Date();
  return `ht_m_${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
}
function wRange() {
  const d = new Date(), day = d.getDay() || 7, m = new Date(d);
  m.setDate(d.getDate() - day + 1);
  const s = new Date(m); s.setDate(m.getDate() + 6);
  const f = x => x.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  return `${f(m)} – ${f(s)}`;
}
function mName() {
  return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}


// ══════════════════════════════════════════════════════════════════
// LOAD & SAVE
// ══════════════════════════════════════════════════════════════════

function loadAll() {
  HABITS = lsGet('ht_habits') || JSON.parse(JSON.stringify(DEFAULT_HABITS));
  D = lsGet(dKey()) || {};  if (!D.remarks) D.remarks = {};
  W = lsGet(wKey()) || {};  if (!W.remarks) W.remarks = {};
  M = lsGet(mKey()) || {};  if (!M.remarks) M.remarks = {};
  QW = lsGet('ht_qw') || DEFAULT_QW();

  const lastSync = lsGet('ht_lastsync');
  document.getElementById('syncinfo').innerHTML = lastSync
    ? `<b>Last synced:</b> ${lastSync}`
    : `Sync to Google Drive to access your habits from any device.`;
}

function sv(section) {
  if      (section === 'd') lsSet(dKey(),    D);
  else if (section === 'w') lsSet(wKey(),    W);
  else if (section === 'm') lsSet(mKey(),    M);
  else if (section === 'q') lsSet('ht_qw',   QW);
  scheduleSync();
}


// ══════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════

function toast(msg, ok = true) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = ok ? 'rgba(74,142,82,0.5)' : 'rgba(188,58,58,0.4)';
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2600);
}


// ══════════════════════════════════════════════════════════════════
// CARD BUILDER
// ══════════════════════════════════════════════════════════════════

function mkCard(id, label, ctrl, note, extra, section, done, strike) {
  const c = document.createElement('div');
  c.className = `hc${done ? ' done' : ''}`;
  c.id = `hc-${id}`;
  c.innerHTML = `
    <div class="hr">
      <span class="hn${strike ? ' sk' : ''}">${label}</span>
      ${ctrl}
      <button class="rnb${note ? ' noted' : ''}" id="rb-${id}" onclick="tr('${id}')">${penSVG()}</button>
      <button class="hdel" onclick="delHabit('${section}','${id}')">${xSVG()}</button>
    </div>
    ${extra || ''}
    <div class="ra" id="ra-${id}">
      <textarea class="rta" placeholder="Add a note…" onblur="sR('${section}','${id}',this.value)">${note}</textarea>
    </div>`;
  return c;
}

function mkSum(el, tot, max, cnt, total, allDone) {
  el.innerHTML = `
    <div>
      <div class="sl">Days logged</div>
      <div class="sn${allDone ? ' ok' : ''}">${tot}/${max}</div>
    </div>
    <div>
      <div class="sl">Habits done</div>
      <div class="sn${allDone ? ' ok' : ''}">${cnt}/${total}</div>
    </div>
    <div style="flex:2">
      <div class="sl">Progress</div>
      <div style="margin-top:7px">
        <div class="pb">
          <div class="pf${allDone ? ' ok' : ''}" style="width:${max ? Math.round(tot / max * 100) : 0}%"></div>
        </div>
      </div>
    </div>`;
}


// ══════════════════════════════════════════════════════════════════
// RENDER — DAILY
// ══════════════════════════════════════════════════════════════════

function rD() {
  const el = document.getElementById('dl');
  el.innerHTML = '';

  HABITS.daily.forEach(h => {
    const max  = h.max || 8;
    const val  = h.type === 'c' ? (D[h.id] === true) : (D[h.id] || 0);
    const done = h.type === 'c' ? val : val >= max;
    const note = (D.remarks && D.remarks[h.id]) || '';
    let ctrl = '', extra = '';

    if (h.type === 'c') {
      ctrl = `<button class="chk${val ? ' on' : ''}" onclick="tC('${h.id}')">${val ? ckSVG() : ''}</button>`;
    } else {
      ctrl  = `<div class="cnt"><button class="cb" onclick="aW('${h.id}',-1,${max})">−</button><span class="cv">${val}<span class="ct">/${max}</span></span><button class="cb" onclick="aW('${h.id}',1,${max})">+</button></div>`;
      extra = `<div class="dots">${Array.from({ length: max }, (_, i) => `<div class="dot${i < val ? ' on' : ''}" onclick="sW('${h.id}',${i + 1},${max})"></div>`).join('')}</div>`;
    }

    el.appendChild(mkCard(h.id, h.label, ctrl, note, extra, 'daily', done, done && h.type === 'c'));
  });

  if (!HABITS.daily.length) {
    el.innerHTML = '<div class="empty">No daily habits yet — add one above</div>';
  }
}

function tC(id)              { D[id] = !D[id];                                        sv('d'); rD(); }
function aW(id, delta, max)  { D[id] = Math.max(0, Math.min(max, (D[id] || 0) + delta)); sv('d'); rD(); }
function sW(id, v, max)      { D[id] = (D[id] || 0) === v ? v - 1 : v;               sv('d'); rD(); }


// ══════════════════════════════════════════════════════════════════
// RENDER — WEEKLY
// ══════════════════════════════════════════════════════════════════

function rW() {
  document.getElementById('wlbl').textContent = `Week of ${wRange()}`;

  const hs      = HABITS.weekly;
  const tot     = hs.reduce((s, h) => s + Math.min(W[h.id] || 0, h.target), 0);
  const max     = hs.reduce((s, h) => s + h.target, 0);
  const allDone = hs.length > 0 && hs.every(h => (W[h.id] || 0) >= h.target);

  mkSum(document.getElementById('wsum'), tot, max, hs.filter(h => (W[h.id] || 0) >= h.target).length, hs.length, allDone);

  const el = document.getElementById('wl');
  el.innerHTML = '';

  hs.forEach(h => {
    const v    = W[h.id] || 0;
    const done = v >= h.target;
    const note = (W.remarks && W.remarks[h.id]) || '';
    const pct  = Math.min(100, Math.round(v / h.target * 100));
    const ctrl = `<div class="cnt"><button class="cb" onclick="aWk('${h.id}',-1)">−</button><span class="cv">${v}<span class="ct">/${h.target}</span></span><button class="cb" onclick="aWk('${h.id}',1)">+</button></div>`;
    const pb   = `<div class="pw"><div class="pb"><div class="pf${done ? ' ok' : ''}" style="width:${pct}%"></div></div></div>`;
    el.appendChild(mkCard(h.id, h.label, ctrl, note, pb, 'weekly', done, false));
  });

  if (!hs.length) el.innerHTML = '<div class="empty">No weekly habits yet — add one above</div>';
}

function aWk(id, d) { W[id] = Math.max(0, (W[id] || 0) + d); sv('w'); rW(); }


// ══════════════════════════════════════════════════════════════════
// RENDER — MONTHLY
// ══════════════════════════════════════════════════════════════════

function rM() {
  document.getElementById('mlbl').textContent = mName();

  const hs      = HABITS.monthly;
  const tot     = hs.reduce((s, h) => s + Math.min(M[h.id] || 0, h.target), 0);
  const max     = hs.reduce((s, h) => s + h.target, 0);
  const allDone = hs.length > 0 && hs.every(h => (M[h.id] || 0) >= h.target);

  mkSum(document.getElementById('msum'), tot, max, hs.filter(h => (M[h.id] || 0) >= h.target).length, hs.length, allDone);

  const el = document.getElementById('ml');
  el.innerHTML = '';

  hs.forEach(h => {
    const v    = M[h.id] || 0;
    const done = v >= h.target;
    const note = (M.remarks && M.remarks[h.id]) || '';
    const pct  = Math.min(100, Math.round(v / h.target * 100));
    const ctrl = `<div class="cnt"><button class="cb" onclick="aMo('${h.id}',-1)">−</button><span class="cv">${v}<span class="ct">/${h.target}</span></span><button class="cb" onclick="aMo('${h.id}',1)">+</button></div>`;
    const pb   = `<div class="pw"><div class="pb"><div class="pf${done ? ' ok' : ''}" style="width:${pct}%"></div></div></div>`;
    el.appendChild(mkCard(h.id, h.label, ctrl, note, pb, 'monthly', done, false));
  });

  if (!hs.length) el.innerHTML = '<div class="empty">No monthly habits yet — add one above</div>';
}

function aMo(id, d) { M[id] = Math.max(0, (M[id] || 0) + d); sv('m'); rM(); }


// ══════════════════════════════════════════════════════════════════
// NOTES
// ══════════════════════════════════════════════════════════════════

function tr(key) {
  const a = document.getElementById(`ra-${key}`);
  if (!a) return;
  const was = a.classList.contains('on');

  document.querySelectorAll('.ra').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.rnb').forEach(x => x.classList.remove('on'));

  if (!was) {
    a.classList.add('on');
    const b = document.getElementById(`rb-${key}`);
    if (b) b.classList.add('on');
    setTimeout(() => { const ta = a.querySelector('textarea'); if (ta) ta.focus(); }, 30);
  }
}

function sR(section, id, v) {
  const map = { daily: D, weekly: W, monthly: M };
  const obj = map[section];
  if (!obj) return;
  if (!obj.remarks) obj.remarks = {};
  obj.remarks[id] = v;
  sv(section[0]);
  const b = document.getElementById(`rb-${id}`);
  if (b) b.classList.toggle('noted', v && v.length > 0);
}


// ══════════════════════════════════════════════════════════════════
// ADD / DELETE HABITS
// ══════════════════════════════════════════════════════════════════

function showAddForm(section) {
  document.querySelectorAll('.ahfrm').forEach(f => f.classList.remove('on'));
  const f = document.getElementById(`af-${section}`);
  if (f) {
    f.classList.add('on');
    setTimeout(() => f.querySelector('.fi').focus(), 30);
  }
}

function closeAddForm(section) {
  const f = document.getElementById(`af-${section}`);
  if (f) {
    f.classList.remove('on');
    const fi = f.querySelector('.fi');
    if (fi) fi.value = '';
  }
}

function toggleMaxField() {
  const t = document.getElementById('ft-daily');
  const m = document.getElementById('fm-daily');
  if (t && m) m.style.display = t.value === 'w' ? 'inline-block' : 'none';
}

function addHabit(section) {
  const nameEl = document.getElementById(`fn-${section}`);
  const name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { if (nameEl) nameEl.focus(); return; }

  const id = 'h' + Date.now();

  if (section === 'daily') {
    const type = document.getElementById('ft-daily').value;
    const max  = parseInt(document.getElementById('fm-daily').value) || 8;
    HABITS.daily.push(type === 'w' ? { id, label: name, type: 'w', max } : { id, label: name, type: 'c' });
  } else if (section === 'weekly') {
    const target = parseInt(document.getElementById('ft-weekly').value) || 3;
    HABITS.weekly.push({ id, label: name, target });
  } else if (section === 'monthly') {
    const target = parseInt(document.getElementById('ft-monthly').value) || 7;
    HABITS.monthly.push({ id, label: name, target });
  }

  lsSet('ht_habits', HABITS);
  closeAddForm(section);
  if (section === 'daily')        rD();
  else if (section === 'weekly')  rW();
  else                            rM();
  scheduleSync();
}

function delHabit(section, id) {
  if (!confirm('Remove this habit? Your progress data is kept.')) return;
  HABITS[section] = HABITS[section].filter(h => h.id !== id);
  lsSet('ht_habits', HABITS);
  if (section === 'daily')        rD();
  else if (section === 'weekly')  rW();
  else                            rM();
  scheduleSync();
}


// ══════════════════════════════════════════════════════════════════
// QUICK WINS
// ══════════════════════════════════════════════════════════════════

function tf() {
  qfo = !qfo;
  document.getElementById('qaf').classList.toggle('on', qfo);
  if (qfo) setTimeout(() => document.getElementById('qfn').focus(), 30);
}

function da() {
  const n = document.getElementById('qfn').value.trim();
  if (!n) return;
  QW.push({ id: 'q' + Date.now(), task: n, effort: document.getElementById('qfe').value, status: 'pending' });
  sv('q');
  document.getElementById('qfn').value = '';
  qfo = false;
  document.getElementById('qaf').classList.remove('on');
  rQ();
}

function tQ(id) {
  const q = QW.find(x => x.id === id);
  if (!q) return;
  q.status = q.status === 'done' ? 'pending' : 'done';
  sv('q'); rQ();
}

function dQ(id) {
  QW = QW.filter(x => x.id !== id);
  sv('q'); rQ();
}

function sf(f) {
  flt = f;
  document.querySelectorAll('.fb').forEach((b, i) => b.classList.toggle('on', ['all', 'pending', 'done'][i] === f));
  rQ();
}

function rQ() {
  let list = [...QW];
  if      (flt === 'pending') list = list.filter(q => q.status === 'pending');
  else if (flt === 'done')    list = list.filter(q => q.status === 'done');

  list.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return parseInt(a.effort) - parseInt(b.effort);
  });

  const el = document.getElementById('ql');
  el.innerHTML = '';

  if (!list.length) {
    el.innerHTML = `<div class="empty">${flt === 'done' ? 'No completed tasks yet' : 'No pending tasks — add one above'}</div>`;
    return;
  }

  list.forEach(q => {
    const done = q.status === 'done';
    const c = document.createElement('div');
    c.className = `qc${done ? ' dc' : ''}`;
    c.innerHTML = `<span class="et">${q.effort}m</span><span class="qn">${q.task}</span><button class="qk${done ? ' dn' : ''}" onclick="tQ('${q.id}')">${done ? ckSVG() : ''}</button><button class="qdel" onclick="dQ('${q.id}')">×</button>`;
    el.appendChild(c);
  });
}


// ══════════════════════════════════════════════════════════════════
// TAB SWITCH
// ══════════════════════════════════════════════════════════════════

function sw(tab) {
  document.querySelectorAll('.tab').forEach((b, i) =>
    b.classList.toggle('on', ['daily', 'weekly', 'monthly', 'wins'][i] === tab)
  );
  document.querySelectorAll('.pnl').forEach(p => p.classList.remove('on'));
  document.getElementById(`p-${tab}`).classList.add('on');
}


// ══════════════════════════════════════════════════════════════════
// GOOGLE DRIVE — OAUTH
// ══════════════════════════════════════════════════════════════════

function gisLoaded() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID')) return;
  if (!window.google?.accounts) { setTimeout(gisLoaded, 500); return; }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.file',
    callback: (resp) => {
      if (resp.error) { toast('Google sign-in failed', false); return; }
      gAccessToken = resp.access_token;
      if (afterAuth) { const cb = afterAuth; afterAuth = null; cb(); }
    }
  });
}

function requestToken(cb) {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID')) {
    toast('Google Drive not set up', false); return;
  }
  if (gAccessToken) { cb(); return; }
  if (!tokenClient) { toast('Auth not ready — try again in a moment', false); return; }
  afterAuth = cb;
  tokenClient.requestAccessToken({ prompt: '' });
}


// ══════════════════════════════════════════════════════════════════
// GOOGLE DRIVE — REST API
// ══════════════════════════════════════════════════════════════════

async function driveFind(name) {
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(name)}'+and+trashed%3Dfalse&fields=files(id)&spaces=drive`,
    { headers: { Authorization: `Bearer ${gAccessToken}` } }
  );
  if (!r.ok) throw new Error('find_' + r.status);
  return (await r.json()).files?.[0] || null;
}

async function driveSave(content, name = 'habit-tracker-backup.json') {
  const existing = await driveFind(name);
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(existing ? {} : { name, mimeType: 'application/json' })], { type: 'application/json' }));
  form.append('file',     new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
  const r = await fetch(url, { method: existing ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${gAccessToken}` }, body: form });
  if (!r.ok) throw new Error('save_' + r.status);
}

async function driveLoad(name = 'habit-tracker-backup.json') {
  const file = await driveFind(name);
  if (!file) return null;
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${gAccessToken}` } }
  );
  if (!r.ok) throw new Error('load_' + r.status);
  return await r.json();
}

function buildPayload() {
  return {
    habits:   HABITS,
    daily:    { [dKey()]: D },
    weekly:   { [wKey()]: W },
    monthly:  { [mKey()]: M },
    wins:     QW,
    syncedAt: new Date().toISOString()
  };
}


// ══════════════════════════════════════════════════════════════════
// SYNC ACTIONS
// ══════════════════════════════════════════════════════════════════

function syncTrigger() { requestToken(doSync); }
function loadTrigger() { requestToken(doLoadDrive); }

async function doSync() {
  const btn = document.getElementById('syncbtn');
  btn.disabled = true; btn.textContent = 'Syncing…';
  try {
    await driveSave(buildPayload());
    const ts = new Date().toLocaleString('en-IN');
    lsSet('ht_lastsync', ts);
    document.getElementById('syncinfo').innerHTML = `<b>Last synced:</b> ${ts}`;
    toast('Synced to Google Drive');
  } catch (e) {
    if (e.message.includes('401') || e.message.includes('403')) { gAccessToken = null; requestToken(doSync); }
    else toast('Sync failed — check your connection', false);
  }
  btn.disabled = false; btn.textContent = '↑ Sync to Drive';
}

async function doLoadDrive() {
  const btn = document.getElementById('loadbtn');
  btn.disabled = true; btn.textContent = 'Loading…';
  try {
    const data = await driveLoad();
    if (!data) {
      toast('No backup found in Drive yet', false);
    } else {
      if (data.habits)  { HABITS = data.habits; lsSet('ht_habits', HABITS); }
      if (data.wins)    { QW = data.wins;        lsSet('ht_qw', QW); }
      if (data.daily)   for (const [k, v] of Object.entries(data.daily))   lsSet(k, v);
      if (data.weekly)  for (const [k, v] of Object.entries(data.weekly))  lsSet(k, v);
      if (data.monthly) for (const [k, v] of Object.entries(data.monthly)) lsSet(k, v);
      loadAll(); rD(); rW(); rM(); rQ();
      toast('Data restored from Google Drive');
    }
  } catch (e) {
    if (e.message.includes('401')) { gAccessToken = null; requestToken(doLoadDrive); }
    else toast('Could not load from Drive', false);
  }
  btn.disabled = false; btn.textContent = '↓ Load from Drive';
}

function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { if (gAccessToken) doSync(); }, 20000);
}


// ══════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════

document.getElementById('hdr').textContent = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

document.getElementById('qfn').addEventListener('keydown', e => { if (e.key === 'Enter') da(); });

['daily', 'weekly', 'monthly'].forEach(s => {
  const inp = document.getElementById(`fn-${s}`);
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(s); });
});

loadAll();
rD();
rW();
rM();
rQ();
