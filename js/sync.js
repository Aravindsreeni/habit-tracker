// ── sync.js — Google Drive OAuth + sync ───────────────────────────
import { lsGet, lsSet, dKey, wKey, mKey, HABITS, D, W, M, QW } from './store.js';
import { toast } from './ui.js';

const GOOGLE_CLIENT_ID = '18794991368-45hja4sdkilvcmbi4k50cnqmb9b2plm1.apps.googleusercontent.com';

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

// ── Drive REST ─────────────────────────────────────────────────────
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

// NOTE (B1.3): buildPayload will be expanded to include ALL ht_* keys for full history.
// For now it matches the original behaviour so existing syncs aren't broken.
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

// ── Sync actions ───────────────────────────────────────────────────
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
    toast('Synced to Google Drive');
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
      // Re-import store setters dynamically to keep store in sync
      const store = await import('./store.js');
      if (data.habits)  { store.setHabits(data.habits); lsSet('ht_habits', data.habits); }
      if (data.wins)    { store.setQW(data.wins);        lsSet('ht_qw', data.wins); }
      if (data.daily)   for (const [k, v] of Object.entries(data.daily))   lsSet(k, v);
      if (data.weekly)  for (const [k, v] of Object.entries(data.weekly))  lsSet(k, v);
      if (data.monthly) for (const [k, v] of Object.entries(data.monthly)) lsSet(k, v);

      store.loadAll();
      const views = await import('./views/_all.js');
      views.renderAll();
      toast('Data restored from Google Drive');
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
