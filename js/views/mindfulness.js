// ── mindfulness.js — Breathing pacer + meditation timer (B7.1) ────
// A calm, low-friction place to slow the breath or sit for a few minutes.
// Two paced-breathing patterns (Box 4-4-4-4 and 4-7-8) drive an animated
// expand / hold / contract circle, plus a simple meditation countdown.
// Everything runs locally; nothing is logged or stored. No disclaimer is
// needed here — there's no journalling of distressing content — but the tone
// stays positive and pressure-free (Design principles 1, 2, 4).

// ── Breathing patterns ──
// Each phase: { key, label, secs, scale }. `scale` is the circle size the
// phase animates toward (1 = fully expanded inhale, 0.45 = contracted exhale;
// holds keep the previous size). Pure helpers below index into `phases`.
const PATTERNS = {
  box: {
    label: 'Box · 4-4-4-4',
    phases: [
      { key: 'in',   label: 'Breathe in',  secs: 4, scale: 1 },
      { key: 'hold', label: 'Hold',        secs: 4, scale: 1 },
      { key: 'out',  label: 'Breathe out', secs: 4, scale: 0.45 },
      { key: 'hold', label: 'Hold',        secs: 4, scale: 0.45 }
    ]
  },
  '478': {
    label: '4-7-8',
    phases: [
      { key: 'in',   label: 'Breathe in',  secs: 4, scale: 1 },
      { key: 'hold', label: 'Hold',        secs: 7, scale: 1 },
      { key: 'out',  label: 'Breathe out', secs: 8, scale: 0.45 }
    ]
  }
};
const CYCLE_OPTS = [4, 6, 8, 10, 12];
const DUR_OPTS   = [1, 3, 5, 10, 15, 20];   // meditation minutes

// ── Pure logic (node-tested) ──

// Total seconds in one full breathing cycle of `phases`. Pure.
export function cycleSeconds(phases) {
  return phases.reduce((sum, p) => sum + p.secs, 0);
}

// Where are we, `elapsedSec` into a paced-breathing session of `totalCycles`?
// Returns { done, cycle, phaseIndex, phase, remaining } where `cycle` is the
// number of completed cycles and `remaining` counts the whole seconds left in
// the current phase (so a 4 s inhale reads 4 → 3 → 2 → 1). Pure & DST-free
// (works on elapsed seconds, never wall-clock dates).
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
  if (idx >= phases.length) idx = phases.length - 1;   // float guard at boundary

  const phase = phases[idx];
  const remaining = Math.max(1, Math.min(phase.secs, Math.ceil(phase.secs - within)));
  return { done: false, cycle: cyclesDone, phaseIndex: idx, phase, remaining };
}

// Format a seconds count as m:ss (e.g. 90 → "1:30", 600 → "10:00"). Negative
// or fractional inputs clamp/floor to whole non-negative seconds. Pure.
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
export function render() {
  const el = document.getElementById('p-mindfulness');
  if (!el || built) return;

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px"><span class="sec-lbl">Mindfulness</span></div>
    <div class="md-intro">A quiet moment for your breath. No streaks, no scores — just be here for a few cycles or a few minutes.</div>

    <div class="sec-hdr" style="margin-top:18px"><span class="sec-lbl">Breathing pacer</span></div>
    <div class="mf-seg" id="mf-pat">
      ${Object.entries(PATTERNS).map(([k, p]) =>
        `<button class="mf-seg-b${k === bf.patKey ? ' on' : ''}" data-pat="${k}">${p.label}</button>`).join('')}
    </div>
    <div class="mf-row">
      <label for="mf-cycles">Cycles</label>
      <select class="fse" id="mf-cycles">
        ${CYCLE_OPTS.map(n => `<option value="${n}"${n === bf.cycles ? ' selected' : ''}>${n}</option>`).join('')}
      </select>
    </div>
    <div class="hc mf-stage">
      <div class="mf-circle" id="mf-circle"><span class="mf-count" id="mf-count"></span></div>
      <div class="mf-phase" id="mf-phase">Ready when you are.</div>
      <div class="mf-cyc" id="mf-cyc">Cycle 0 / ${bf.cycles}</div>
    </div>
    <div class="mf-ctrl">
      <button class="fsv" id="mf-start">Start</button>
      <button class="fcx" id="mf-stop">Stop</button>
    </div>

    <div class="sec-hdr" style="margin-top:26px"><span class="sec-lbl">Meditation timer</span></div>
    <div class="mf-seg" id="mf-dur">
      ${DUR_OPTS.map(n =>
        `<button class="mf-seg-b${n * 60 === med.durSec ? ' on' : ''}" data-dur="${n}">${n} min</button>`).join('')}
    </div>
    <div class="hc mf-stage">
      <div class="mf-clock" id="mf-clock">${fmtTime(med.durSec)}</div>
      <div class="mf-sub" id="mf-medsub">Tap Start when you're ready.</div>
    </div>
    <div class="mf-ctrl">
      <button class="fsv" id="mf-medstart">Start</button>
      <button class="fcx" id="mf-medpause">Pause</button>
      <button class="fcx" id="mf-medreset">Reset</button>
    </div>`;

  _wire();
  _bfButtons();
  _medButtons();
  built = true;
}

function _wire() {
  document.querySelectorAll('#mf-pat [data-pat]').forEach(b => {
    b.onclick = () => {
      if (bf.running) return;                 // don't switch mid-session
      bf.patKey = b.dataset.pat;
      document.querySelectorAll('#mf-pat [data-pat]').forEach(x =>
        x.classList.toggle('on', x === b));
    };
  });
  $('mf-cycles').onchange = e => {
    bf.cycles = +e.target.value;
    if (!bf.running) $('mf-cyc').textContent = `Cycle 0 / ${bf.cycles}`;
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
  // Snap the circle to its resting (contracted) size with no animation, so the
  // first inhale visibly grows from small.
  const c = $('mf-circle');
  c.classList.remove('hold');
  c.style.transitionDuration = '0s';
  c.style.transform = 'scale(0.45)';
  void c.offsetWidth;                          // force reflow
  bf.tid = setInterval(bfTick, 120);
  bfTick();
  _bfButtons();
}

function bfTick() {
  const phases  = PATTERNS[bf.patKey].phases;
  const elapsed = (Date.now() - bf.startTs) / 1000;
  const st = breathingState(elapsed, phases, bf.cycles);
  if (st.done) { bfComplete(); return; }

  $('mf-count').textContent = st.remaining;
  $('mf-cyc').textContent   = `Cycle ${Math.min(st.cycle + 1, bf.cycles)} / ${bf.cycles}`;

  if (st.phaseIndex !== bf.lastIdx) {
    bf.lastIdx = st.phaseIndex;
    const ph = st.phase;
    $('mf-phase').textContent = ph.label;
    const c = $('mf-circle');
    c.style.transitionDuration = ph.secs + 's';
    c.style.transform = `scale(${ph.scale})`;
    c.classList.toggle('hold', ph.key === 'hold');
  }
}

function bfComplete() {
  bfStop(true);
  $('mf-phase').textContent = 'Done — nicely paced. 🌿';
  $('mf-count').textContent = '✓';
  $('mf-cyc').textContent   = `${bf.cycles} / ${bf.cycles}`;
  playChime();
}

function bfStop(keep) {
  bf.running = false;
  clearInterval(bf.tid);
  bf.lastIdx = -1;
  if (!keep) {
    $('mf-phase').textContent = 'Ready when you are.';
    $('mf-count').textContent = '';
    $('mf-cyc').textContent   = `Cycle 0 / ${bf.cycles}`;
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
  if (med.running) return;                     // ignore while counting down
  med.durSec = min * 60;
  med.accum = 0;
  $('mf-clock').textContent = fmtTime(med.durSec);
  $('mf-medsub').textContent = 'Tap Start when you’re ready.';
  document.querySelectorAll('#mf-dur [data-dur]').forEach(x =>
    x.classList.toggle('on', x === btn));
}
function medStart() {
  if (med.running) return;                     // resumes if paused (accum kept)
  med.running = true;
  med.startTs = Date.now();
  med.tid = setInterval(medTick, 250);
  $('mf-medsub').textContent = 'Settle in… breathe naturally.';
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
  $('mf-medsub').textContent = 'Paused — resume whenever.';
  _medButtons();
}
function medReset() {
  med.running = false;
  med.accum = 0;
  clearInterval(med.tid);
  $('mf-clock').textContent = fmtTime(med.durSec);
  $('mf-medsub').textContent = 'Tap Start when you’re ready.';
  _medButtons();
}
function medComplete() {
  clearInterval(med.tid);
  med.running = false;
  med.accum = 0;
  $('mf-clock').textContent = '0:00';
  $('mf-medsub').textContent = 'Session complete. Well done. 🌿';
  _medButtons();
  playChime();
}
function _medButtons() {
  const s = $('mf-medstart'), p = $('mf-medpause'), r = $('mf-medreset');
  if (!s || !p || !r) return;
  s.disabled = med.running;
  s.textContent = (!med.running && med.accum > 0) ? 'Resume' : 'Start';
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
    osc.frequency.value = 528;                 // a warm, gentle tone
    osc.connect(gain); gain.connect(ctx.destination);
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.start(t);
    osc.stop(t + 1.7);
    osc.onended = () => ctx.close();
  } catch (e) { /* no audio — that's fine */ }
}
