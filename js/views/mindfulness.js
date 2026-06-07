// ── mindfulness.js — Breathing pacer + meditation timer (B7.1) ────
// A calm, low-friction place to slow the breath or sit for a few minutes.
// Two paced-breathing patterns (Box 4-4-4-4 and 4-7-8) drive an animated
// expand / hold / contract circle, plus a simple meditation countdown.
// Everything runs locally; nothing is logged or stored.
import { t } from '../i18n.js';

// ── Breathing patterns ──
// Each phase: { key, label, secs, scale }. `scale` is the circle size the
// phase animates toward. Labels are looked up via t() at render time.
const PATTERNS = {
  box: {
    labelKey: 'mindfulness.pat_box',
    phases: [
      { key: 'in',   labelKey: 'mindfulness.phase_in',   secs: 4, scale: 1 },
      { key: 'hold', labelKey: 'mindfulness.phase_hold', secs: 4, scale: 1 },
      { key: 'out',  labelKey: 'mindfulness.phase_out',  secs: 4, scale: 0.45 },
      { key: 'hold', labelKey: 'mindfulness.phase_hold', secs: 4, scale: 0.45 }
    ]
  },
  '478': {
    labelKey: 'mindfulness.pat_478',
    phases: [
      { key: 'in',   labelKey: 'mindfulness.phase_in',   secs: 4, scale: 1 },
      { key: 'hold', labelKey: 'mindfulness.phase_hold', secs: 7, scale: 1 },
      { key: 'out',  labelKey: 'mindfulness.phase_out',  secs: 8, scale: 0.45 }
    ]
  }
};
const CYCLE_OPTS = [4, 6, 8, 10, 12];
const DUR_OPTS   = [1, 3, 5, 10, 15, 20];

// ── Pure logic (node-tested) ──

export function cycleSeconds(phases) {
  return phases.reduce((sum, p) => sum + p.secs, 0);
}

export function breathingState(elapsedSec, phases, totalCycles) {
  const cyc = cycleSeconds(phases);
  if (cyc <= 0) return { done: true, cycle: 0, phaseIndex: -1, phase: null, remaining: 0 };

  const cyclesDone = Math.floor(elapsedSec / cyc);
  if (totalCycles && cyclesDone >= totalCycles) {
    return { done: true, cycle: totalCycles, phaseIndex: -1, phase: null, remaining: 0 };
  }

  let within = elapsedSec - cyclesDone * cyc;
  let idx = 0;
  for (; idx < phases.length; idx++) {
    if (within < phases[idx].secs) break;
    within -= phases[idx].secs;
  }
  if (idx >= phases.length) idx = phases.length - 1;

  const phase = phases[idx];
  const remaining = Math.max(1, Math.min(phase.secs, Math.ceil(phase.secs - within)));
  return { done: false, cycle: cyclesDone, phaseIndex: idx, phase, remaining };
}

export function fmtTime(totalSec) {
  totalSec = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Runtime state (not persisted) ──
const bf  = { patKey: 'box', cycles: 6, running: false, startTs: 0, tid: 0, lastIdx: -1 };
const med = { durSec: 5 * 60, running: false, startTs: 0, accum: 0, tid: 0 };

const $ = id => document.getElementById(id);

// ── Render (build the panel once; later calls are no-ops so a running
// session is never wiped by a sync-triggered renderAll) ──
let built = false;

// Reset the built flag so the next render() call rebuilds the panel.
// Only effective when no timer is running — avoids interrupting a session.
export function resetBuilt() {
  if (!bf.running && !med.running) built = false;
}

export function render() {
  const el = document.getElementById('p-mindfulness');
  if (!el || built) return;

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px"><span class="sec-lbl">${t('mindfulness.title')}</span></div>
    <div class="md-intro">${t('mindfulness.intro')}</div>

    <div class="sec-hdr" style="margin-top:18px"><span class="sec-lbl">${t('mindfulness.breathing_title')}</span></div>
    <div class="mf-seg" id="mf-pat">
      ${Object.entries(PATTERNS).map(([k, p]) =>
        `<button class="mf-seg-b${k === bf.patKey ? ' on' : ''}" data-pat="${k}">${t(p.labelKey)}</button>`).join('')}
    </div>
    <div class="mf-row">
      <label for="mf-cycles">${t('mindfulness.cycles_label')}</label>
      <select class="fse" id="mf-cycles">
        ${CYCLE_OPTS.map(n => `<option value="${n}"${n === bf.cycles ? ' selected' : ''}>${n}</option>`).join('')}
      </select>
    </div>
    <div class="hc mf-stage">
      <div class="mf-circle" id="mf-circle"><span class="mf-count" id="mf-count"></span></div>
      <div class="mf-phase" id="mf-phase">${t('mindfulness.ready')}</div>
      <div class="mf-cyc" id="mf-cyc">${t('mindfulness.cycle_progress', { n: 0, total: bf.cycles })}</div>
    </div>
    <div class="mf-ctrl">
      <button class="fsv" id="mf-start">${t('common.start')}</button>
      <button class="fcx" id="mf-stop">${t('common.stop')}</button>
    </div>

    <div class="sec-hdr" style="margin-top:26px"><span class="sec-lbl">${t('mindfulness.med_title')}</span></div>
    <div class="mf-seg" id="mf-dur">
      ${DUR_OPTS.map(n =>
        `<button class="mf-seg-b${n * 60 === med.durSec ? ' on' : ''}" data-dur="${n}">${t('mindfulness.dur_min', { n })}</button>`).join('')}
    </div>
    <div class="hc mf-stage">
      <div class="mf-clock" id="mf-clock">${fmtTime(med.durSec)}</div>
      <div class="mf-sub" id="mf-medsub">${t('mindfulness.med_ready')}</div>
    </div>
    <div class="mf-ctrl">
      <button class="fsv" id="mf-medstart">${t('common.start')}</button>
      <button class="fcx" id="mf-medpause">${t('common.pause')}</button>
      <button class="fcx" id="mf-medreset">${t('common.reset')}</button>
    </div>`;

  _wire();
  _bfButtons();
  _medButtons();
  built = true;
}

function _wire() {
  document.querySelectorAll('#mf-pat [data-pat]').forEach(b => {
    b.onclick = () => {
      if (bf.running) return;
      bf.patKey = b.dataset.pat;
      document.querySelectorAll('#mf-pat [data-pat]').forEach(x =>
        x.classList.toggle('on', x === b));
    };
  });
  $('mf-cycles').onchange = e => {
    bf.cycles = +e.target.value;
    if (!bf.running) $('mf-cyc').textContent = t('mindfulness.cycle_progress', { n: 0, total: bf.cycles });
  };
  $('mf-start').onclick = bfStart;
  $('mf-stop').onclick  = () => bfStop(false);

  document.querySelectorAll('#mf-dur [data-dur]').forEach(b => {
    b.onclick = () => setDur(+b.dataset.dur, b);
  });
  $('mf-medstart').onclick = medStart;
  $('mf-medpause').onclick = medPause;
  $('mf-medreset').onclick = medReset;
}

// ── Breathing runtime ──
function bfStart() {
  if (bf.running) return;
  bf.running = true;
  bf.startTs = Date.now();
  bf.lastIdx = -1;
  const c = $('mf-circle');
  c.classList.remove('hold');
  c.style.transitionDuration = '0s';
  c.style.transform = 'scale(0.45)';
  void c.offsetWidth;
  bf.tid = setInterval(bfTick, 120);
  bfTick();
  _bfButtons();
}

function bfTick() {
  const pat     = PATTERNS[bf.patKey];
  const phases  = pat.phases;
  const elapsed = (Date.now() - bf.startTs) / 1000;
  const st = breathingState(elapsed, phases, bf.cycles);
  if (st.done) { bfComplete(); return; }

  $('mf-count').textContent = st.remaining;
  $('mf-cyc').textContent   = t('mindfulness.cycle_progress', { n: Math.min(st.cycle + 1, bf.cycles), total: bf.cycles });

  if (st.phaseIndex !== bf.lastIdx) {
    bf.lastIdx = st.phaseIndex;
    const ph = st.phase;
    $('mf-phase').textContent = t(ph.labelKey);
    const c = $('mf-circle');
    c.style.transitionDuration = ph.secs + 's';
    c.style.transform = `scale(${ph.scale})`;
    c.classList.toggle('hold', ph.key === 'hold');
  }
}

function bfComplete() {
  bfStop(true);
  $('mf-phase').textContent = t('mindfulness.bf_done');
  $('mf-count').textContent = '✓';
  $('mf-cyc').textContent   = t('mindfulness.cycle_progress', { n: bf.cycles, total: bf.cycles });
  playChime();
}

function bfStop(keep) {
  bf.running = false;
  clearInterval(bf.tid);
  bf.lastIdx = -1;
  if (!keep) {
    $('mf-phase').textContent = t('mindfulness.ready');
    $('mf-count').textContent = '';
    $('mf-cyc').textContent   = t('mindfulness.cycle_progress', { n: 0, total: bf.cycles });
    const c = $('mf-circle');
    c.style.transitionDuration = '0.4s';
    c.style.transform = 'scale(0.45)';
    c.classList.remove('hold');
  }
  _bfButtons();
}

function _bfButtons() {
  const s = $('mf-start'), st = $('mf-stop');
  if (!s || !st) return;
  s.disabled  = bf.running;
  st.disabled = !bf.running;
}

// ── Meditation runtime ──
function medElapsed() {
  return med.accum + (med.running ? (Date.now() - med.startTs) / 1000 : 0);
}
function setDur(min, btn) {
  if (med.running) return;
  med.durSec = min * 60;
  med.accum = 0;
  $('mf-clock').textContent = fmtTime(med.durSec);
  $('mf-medsub').textContent = t('mindfulness.med_ready');
  document.querySelectorAll('#mf-dur [data-dur]').forEach(x =>
    x.classList.toggle('on', x === btn));
}
function medStart() {
  if (med.running) return;
  med.running = true;
  med.startTs = Date.now();
  med.tid = setInterval(medTick, 250);
  $('mf-medsub').textContent = t('mindfulness.med_started');
  medTick();
  _medButtons();
}
function medTick() {
  const remain = med.durSec - medElapsed();
  if (remain <= 0) { medComplete(); return; }
  $('mf-clock').textContent = fmtTime(remain);
}
function medPause() {
  if (!med.running) return;
  med.accum = medElapsed();
  med.running = false;
  clearInterval(med.tid);
  $('mf-medsub').textContent = t('mindfulness.med_paused');
  _medButtons();
}
function medReset() {
  med.running = false;
  med.accum = 0;
  clearInterval(med.tid);
  $('mf-clock').textContent = fmtTime(med.durSec);
  $('mf-medsub').textContent = t('mindfulness.med_ready');
  _medButtons();
}
function medComplete() {
  clearInterval(med.tid);
  med.running = false;
  med.accum = 0;
  $('mf-clock').textContent = '0:00';
  $('mf-medsub').textContent = t('mindfulness.med_done');
  _medButtons();
  playChime();
}
function _medButtons() {
  const s = $('mf-medstart'), p = $('mf-medpause'), r = $('mf-medreset');
  if (!s || !p || !r) return;
  s.disabled = med.running;
  s.textContent = (!med.running && med.accum > 0) ? t('common.resume') : t('common.start');
  p.disabled = !med.running;
}

// ── A soft completion chime (Web Audio; fully offline, fails silently) ──
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 528;
    osc.connect(gain); gain.connect(ctx.destination);
    const time = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);
    osc.start(time);
    osc.stop(time + 1.7);
    osc.onended = () => ctx.close();
  } catch (e) { /* no audio — that's fine */ }
}
