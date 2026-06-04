// ── sync.js — Google Drive OAuth + full-history sync + Export/Import ─
import { lsGet, lsSet } from './store.js';
import { toast } from './ui.js';

const GOOGLE_CLIENT_ID = '18794991368-45hja4sdkilvcmbi4k50cnqmb9b2plm1.apps.googleusercontent.com';
const BACKUP_FILENAME  = 'habit-tracker-backup.json';

let gAccessToken = null, tokenClient = null, afterAuth = null, syncTimer = null;

// ── OAuth ──────────────────────────────────────────────────────────
export function gisLoaded() {
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

export function requestToken(cb) {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID')) {
    toast('Google Drive not set up', false); return;
  }
  if (gAccessToken) { cb(); return; }
  if (!tokenClient) { toast('Auth not ready — try again in a moment', false); return; }
  afterAuth = cb;
  tokenClient.requestAccessToken({ prompt: '' });
}

// ── Full-history payload ───────────────────────────────────────────
// Collects ALL ht_* keys from localStorage so Drive holds the complete archive.
export function buildPayload() {
  const payload = { syncedAt: new Date().toISOString() };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('ht_')) {
      payload[key] = lsGet(key);
    }
  }
  return payload;
}

// ── Drive REST ─────────────────────────────────────────────────────
async function driveFind(name) {
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(name)}'+and+trashed%3Dfalse&fields=files(id)&spaces=drive`,
    { headers: { Authorization: `Bearer ${gAccessToken}` } }
  );
  if (!r.ok) throw new Error('find_' + r.status);
  return (await r.json()).files?.[0] || null;
}

async function driveSave(content, name = BACKUP_FILENAME) {
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

async function driveLoad(name = BACKUP_FILENAME) {
  const file = await driveFind(name);
  if (!file) return null;
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${gAccessToken}` } }
  );
  if (!r.ok) throw new Error('load_' + r.status);
  return await r.json();
}

// ── Restore payload → localStorage → re-render ────────────────────
async function restorePayload(data) {
  // Write every ht_* key from the backup back to localStorage
  for (const [key, val] of Object.entries(data)) {
    if (key.startsWith('ht_')) lsSet(key, val);
  }
  const store = await import('./store.js');
  store.loadAll();
  const views = await import('./views/_all.js');
  views.renderAll();
}

// ── Sync actions (Drive) ───────────────────────────────────────────
export function syncTrigger() { requestToken(doSync); }
export function loadTrigger() { requestToken(doLoadDrive); }

async function doSync() {
  const btn = document.getElementById('syncbtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Syncing…'; }
  try {
    await driveSave(buildPayload());
    const ts = new Date().toLocaleString('en-IN');
    lsSet('ht_lastsync', ts);
    const el = document.getElementById('syncinfo');
    if (el) el.innerHTML = `<b>Last synced:</b> ${ts}`;
    toast('Synced to Google Drive ✓');
  } catch (e) {
    if (e.message.includes('401') || e.message.includes('403')) { gAccessToken = null; requestToken(doSync); }
    else toast('Sync failed — check your connection', false);
  }
  if (btn) { btn.disabled = false; btn.textContent = '↑ Sync to Drive'; }
}

async function doLoadDrive() {
  const btn = document.getElementById('loadbtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
  try {
    const data = await driveLoad();
    if (!data) {
      toast('No backup found in Drive yet', false);
    } else {
      await restorePayload(data);
      toast('Data restored from Google Drive ✓');
    }
  } catch (e) {
    if (e.message.includes('401')) { gAccessToken = null; requestToken(doLoadDrive); }
    else toast('Could not load from Drive', false);
  }
  if (btn) { btn.disabled = false; btn.textContent = '↓ Load from Drive'; }
}

export function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { if (gAccessToken) doSync(); }, 20000);
}

// ── Export / Import JSON (offline backup) ─────────────────────────
export function exportJSON() {
  const payload = buildPayload();
  const blob    = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup downloaded ✓');
}

export function importJSON() {
  const inp = document.createElement('input');
  inp.type  = 'file';
  inp.accept = '.json,application/json';
  inp.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // Validate: must have at least ht_habits
      if (!data.ht_habits && !data.habits) {
        toast('Invalid backup file', false); return;
      }
      // Support both new flat format (ht_* keys) and old nested format
      if (data.ht_habits) {
        await restorePayload(data);
      } else {
        // Old format compatibility
        if (data.habits)  lsSet('ht_habits', data.habits);
        if (data.wins)    lsSet('ht_qw', data.wins);
        if (data.daily)   for (const [k, v] of Object.entries(data.daily))   lsSet(k, v);
        if (data.weekly)  for (const [k, v] of Object.entries(data.weekly))  lsSet(k, v);
        if (data.monthly) for (const [k, v] of Object.entries(data.monthly)) lsSet(k, v);
        const store = await import('./store.js');
        store.loadAll();
        const views = await import('./views/_all.js');
        views.renderAll();
      }
      toast('Data imported successfully ✓');
    } catch (err) {
      toast('Could not read backup file', false);
    }
  };
  inp.click();
}
