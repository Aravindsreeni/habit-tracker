// ── reminders.js — Recurring timer + Notification API ─────────────
// Provides configurable reminders (eye-drop, custom).
// Foreground-reliable (desktop-while-working). Background/closed-app
// notifications require the future native (Capacitor) build.
import { lsGet, lsSet } from './store.js';
import { toast } from './ui.js';

const REM_KEY    = 'ht_reminders';
const LOG_PREFIX = 'ht_rem_log_';   // ht_rem_log_YYYY-MM-DD → { [remId]: count }

// ── Built-in presets ───────────────────────────────────────────────
export const PRESETS = [
  { label: '20-20-20 (eye strain)',  minutes: 20 },
  { label: 'Hourly (eye drops)',     minutes: 60 },
  { label: 'Every 90 min',          minutes: 90 },
  { label: 'Every 2 hrs',           minutes: 120 }
];

// ── State ──────────────────────────────────────────────────────────
let _timers   = {};   // remId → { intervalId, nextAt, remaining }
let _bannerCb = null; // called when a reminder fires to update UI

export function setBannerCallback(fn) { _bannerCb = fn; }

// ── Load / save config ─────────────────────────────────────────────
export function getReminders()     { return lsGet(REM_KEY) || []; }
export function saveReminders(arr) { lsSet(REM_KEY, arr); }

export function addReminder(label, minutes, activeFrom = '08:00', activeTo = '22:00') {
  const arr = getReminders();
  const r = { id: 'r' + Date.now(), label, minutes: parseInt(minutes), activeFrom, activeTo, enabled: true };
  arr.push(r);
  saveReminders(arr);
  startTimer(r);
  return r;
}

export function toggleReminder(id) {
  const arr = getReminders();
  const r   = arr.find(x => x.id === id);
  if (!r) return;
  r.enabled = !r.enabled;
  saveReminders(arr);
  if (r.enabled) startTimer(r); else stopTimer(id);
}

export function deleteReminder(id) {
  stopTimer(id);
  saveReminders(getReminders().filter(x => x.id !== id));
}

// ── Today's drop / reminder log ────────────────────────────────────
function todayLogKey() {
  const d = new Date();
  return `${LOG_PREFIX}${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function logFired(remId) {
  const key = todayLogKey();
  const log = lsGet(key) || {};
  log[remId] = (log[remId] || 0) + 1;
  lsSet(key, log);
  return log[remId];
}
export function getTodayCount(remId) {
  const log = lsGet(todayLogKey()) || {};
  return log[remId] || 0;
}

// ── Active-hours check ─────────────────────────────────────────────
function isActive(r) {
  if (!r.activeFrom || !r.activeTo) return true;
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = r.activeFrom.split(':').map(Number);
  const [th, tm] = r.activeTo.split(':').map(Number);
  return mins >= fh * 60 + fm && mins < th * 60 + tm;
}

// ── Timer engine ───────────────────────────────────────────────────
export function startTimer(r) {
  if (!r.enabled) return;
  stopTimer(r.id);

  const ms = r.minutes * 60 * 1000;
  const nextAt = Date.now() + ms;
  _timers[r.id] = { nextAt, remaining: ms };

  // Tick every second to update countdown display
  _timers[r.id].intervalId = setInterval(() => tick(r), 1000);
}

function tick(r) {
  const t = _timers[r.id];
  if (!t) return;
  t.remaining = Math.max(0, t.nextAt - Date.now());

  if (t.remaining === 0) {
    clearInterval(t.intervalId);
    if (isActive(r)) {
      fireReminder(r);
    } else {
      // Outside active hours — reset and wait
      startTimer(r);
    }
  }
  _bannerCb?.();
}

export function stopTimer(id) {
  if (_timers[id]) { clearInterval(_timers[id].intervalId); delete _timers[id]; }
}

export function snooze(remId, mins = 10) {
  const r = getReminders().find(x => x.id === remId);
  if (!r) return;
  stopTimer(remId);
  const ms = mins * 60 * 1000;
  _timers[remId] = { nextAt: Date.now() + ms, remaining: ms };
  _timers[remId].intervalId = setInterval(() => tick(r), 1000);
  hideBanner(remId);
  _bannerCb?.();
}

export function dismiss(remId) {
  const count = logFired(remId);
  const r = getReminders().find(x => x.id === remId);
  if (r) startTimer(r);      // reset for next firing
  hideBanner(remId);
  _bannerCb?.();
  return count;
}

export function getRemaining(remId) {
  return _timers[remId]?.remaining ?? null;
}

// ── Banner state ───────────────────────────────────────────────────
const _due = new Set();
function fireReminder(r) {
  _due.add(r.id);
  logFired(r.id);
  _bannerCb?.();
  // Browser Notification (requires permission)
  sendNotification(r);
}
export function isDue(remId) { return _due.has(remId); }
function hideBanner(id) { _due.delete(id); }

// ── Notifications (web + native bridge) ────────────────────────────
// When running inside the Capacitor native shell (Phase 8), Capacitor injects a
// global `window.Capacitor` with plugin proxies. We progressively enhance to the
// LocalNotifications plugin there; in a plain browser these guards are no-ops and
// the original web Notification path runs unchanged (no bundler import needed).
function nativeLN() {
  return window.Capacitor?.Plugins?.LocalNotifications || null;
}

// Fire an immediate native local notification. Returns true if handled natively.
function nativeNotify(title, body) {
  const LN = nativeLN();
  if (!LN) return false;
  try {
    LN.schedule({
      notifications: [{
        id: Date.now() % 2147483647,       // 32-bit id required by the plugin
        title,
        body,
        schedule: { at: new Date(Date.now() + 200) }
      }]
    });
  } catch (e) { /* plugin error — fall through silently */ }
  return true;
}

export async function requestNotificationPermission() {
  const LN = nativeLN();
  if (LN) {
    try {
      const res = await LN.requestPermissions();
      return res?.display === 'granted' ? 'granted' : (res?.display || 'denied');
    } catch (e) { return 'denied'; }
  }
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted')  return 'granted';
  if (Notification.permission === 'denied')   return 'denied';
  return await Notification.requestPermission();
}

function sendNotification(r) {
  const count = getTodayCount(r.id);
  const body  = r.label.toLowerCase().includes('eye')
    ? `Time to lubricate your eyes 👁 (${count}× today)`
    : `${r.label} — tap to dismiss`;
  if (nativeNotify('Habit Tracker', body)) return;        // native path (Capacitor)
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('Habit Tracker', { body, icon: './icons/icon-192.svg' });
}

// ── Init: start all enabled reminders on page load ─────────────────
export function initReminders(bannerCb) {
  _bannerCb = bannerCb;
  getReminders().filter(r => r.enabled).forEach(startTimer);
}
