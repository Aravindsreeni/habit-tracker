// ── cbt.js — CBT Thought Record (B6.3) ────────────────────────────
// Beck's 7-column cognitive-restructuring worksheet: name the situation and the
// automatic thought, weigh the evidence for and against it, form a balanced
// alternative, then re-rate the emotion. Completing one typically eases emotion
// intensity ~20–40% (see CLAUDE.md evidence table).
// (B6.4 will extend this same view/`ht_cbt` array with ABC(DE) + distortions.)
// Self-help tool, NOT a substitute for professional care (disclaimer below).
import { CBT, setCBT, svCBT } from '../store.js';
import { xSVG } from '../ui.js';

// The reflective text columns (emotion + before/after % are handled separately).
const TEXTCOLS = [
  { key: 'situation',       label: 'Situation',
    ph: 'What happened? Where and when?' },
  { key: 'thoughts',        label: 'Automatic thought(s)',
    ph: 'What went through your mind? What did it mean to you?' },
  { key: 'evidenceFor',     label: 'Evidence for the thought',
    ph: 'Facts that seem to support the thought…' },
  { key: 'evidenceAgainst', label: 'Evidence against the thought',
    ph: "Facts that don't fit it, or another way to see it…" },
  { key: 'balanced',        label: 'Balanced / alternative thought',
    ph: 'A fairer, more rounded way to look at it…' }
];

// ── Pure logic (node-tested) ──
// Coerce any stored shape into a complete, safe thought-record entry.
export function normalizeCbt(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const str = v => (typeof v === 'string' ? v.trim() : '');
  const pct = v => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
  };
  return {
    id:        typeof o.id === 'string' ? o.id : '',
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : '',
    situation:       str(o.situation),
    thoughts:        str(o.thoughts),
    emotion:         str(o.emotion),
    before:          pct(o.before),
    evidenceFor:     str(o.evidenceFor),
    evidenceAgainst: str(o.evidenceAgainst),
    balanced:        str(o.balanced),
    after:           pct(o.after),
    distortions:     Array.isArray(o.distortions) ? o.distortions.filter(x => typeof x === 'string') : []
  };
}

// Drop in intensity after restructuring; positive = emotion eased. null if unrated. Pure.
export function intensityDelta(before, after) {
  if (typeof before !== 'number' || typeof after !== 'number') return null;
  return before - after;
}

// Worth saving if there's at least a situation or an automatic thought. Pure.
export function hasContent(entry) {
  const e = normalizeCbt(entry);
  return !!(e.situation || e.thoughts);
}

// ── View state ──
let formOpen = false;
let openId   = null;

// ── Render ──
export function render() {
  const el = document.getElementById('p-cbt');
  if (!el) return;

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">Thought records${CBT.length ? ` · ${CBT.length}` : ''}</span>
      <button class="sec-add" id="cbt-new">${formOpen ? 'Close' : '+ New record'}</button>
    </div>
    <div class="cbt-intro">Untangle a tough moment: weigh the evidence, then find a balanced thought.</div>
    <div id="cbt-form"></div>
    <div id="cbt-list"></div>
    ${disclaimerHTML()}`;

  el.querySelector('#cbt-new')?.addEventListener('click', () => {
    formOpen = !formOpen;
    render();
    if (formOpen) document.getElementById('cbt-situation')?.focus();
  });

  _renderForm();
  _renderList();
}

function _renderForm() {
  const host = document.getElementById('cbt-form');
  if (!host) return;
  if (!formOpen) { host.innerHTML = ''; return; }

  host.innerHTML = `
    <div class="cbt-card cbt-formcard">
      ${field('situation')}
      ${field('thoughts')}
      <div class="cbt-fld">
        <label class="cbt-lbl">Emotion(s) & intensity now</label>
        <div class="cbt-emorow">
          <input class="fi" id="cbt-emotion" type="text" placeholder="e.g. anxious, ashamed" maxlength="120">
          <input class="fnum" id="cbt-before" type="number" min="0" max="100" placeholder="%">
        </div>
      </div>
      ${field('evidenceFor')}
      ${field('evidenceAgainst')}
      ${field('balanced')}
      <div class="cbt-fld">
        <label class="cbt-lbl">Re-rate that emotion now</label>
        <input class="fnum" id="cbt-after" type="number" min="0" max="100" placeholder="%">
      </div>
      <div class="fact">
        <button class="fcx" id="cbt-cancel">Cancel</button>
        <button class="fsv" id="cbt-save">Save record</button>
      </div>
    </div>`;

  host.querySelector('#cbt-save')?.addEventListener('click', _save);
  host.querySelector('#cbt-cancel')?.addEventListener('click', () => { formOpen = false; render(); });
}

function field(key) {
  const col = TEXTCOLS.find(c => c.key === key);
  return `
    <div class="cbt-fld">
      <label class="cbt-lbl">${col.label}</label>
      <textarea class="rta" id="cbt-${key}" maxlength="1000" placeholder="${esc(col.ph)}"></textarea>
    </div>`;
}

function _save() {
  const val = id => document.getElementById(id)?.value ?? '';
  const draft = {
    situation:       val('cbt-situation'),
    thoughts:        val('cbt-thoughts'),
    emotion:         val('cbt-emotion'),
    before:          val('cbt-before'),
    evidenceFor:     val('cbt-evidenceFor'),
    evidenceAgainst: val('cbt-evidenceAgainst'),
    balanced:        val('cbt-balanced'),
    after:           val('cbt-after')
  };
  if (!hasContent(draft)) {
    document.getElementById('cbt-situation')?.focus();
    import('../ui.js').then(m => m.toast('Add a situation or thought first', false));
    return;
  }
  const entry = normalizeCbt(draft);
  entry.id = 'c' + Date.now();
  entry.createdAt = new Date().toISOString();
  setCBT([entry, ...CBT]);
  svCBT();
  formOpen = false;
  openId = entry.id;            // expand the new record so the user sees their work
  render();
  import('../ui.js').then(m => m.toast('Thought record saved ✓'));
}

// ── List (newest first, tap to expand) ──
function _renderList() {
  const host = document.getElementById('cbt-list');
  if (!host) return;
  if (!CBT.length) {
    host.innerHTML = '<div class="empty">No thought records yet — start one when a moment feels heavy</div>';
    return;
  }
  host.innerHTML = '';
  CBT.map(normalizeCbt).forEach(e => host.appendChild(_card(e)));
}

function _card(e) {
  const open  = openId === e.id;
  const delta = intensityDelta(e.before, e.after);
  const title = e.situation || e.thoughts || 'Thought record';
  const c = document.createElement('div');
  c.className = `hc cbt-card${open ? ' on' : ''}`;
  c.innerHTML = `
    <div class="hr cbt-hdr" data-cbt-open="${e.id}">
      <span class="hn">${esc(title)}</span>
      ${deltaBadge(delta)}
      <button class="hdel" title="Delete" data-cbt-del="${e.id}">${xSVG()}</button>
    </div>
    ${open ? `<div class="cbt-body">${cardBody(e)}</div>` : ''}`;

  c.querySelector('[data-cbt-open]')?.addEventListener('click', ev => {
    if (ev.target.closest('[data-cbt-del]')) return;
    openId = open ? null : e.id;
    _renderList();
  });
  c.querySelector('[data-cbt-del]')?.addEventListener('click', () => {
    setCBT(CBT.filter(x => normalizeCbt(x).id !== e.id));
    if (openId === e.id) openId = null;
    svCBT();
    render();
  });
  return c;
}

function deltaBadge(delta) {
  if (delta === null) return '';
  if (delta > 0)  return `<span class="cbt-delta eased" title="Emotion eased">▼ ${delta}%</span>`;
  if (delta < 0)  return `<span class="cbt-delta" title="Emotion rose">▲ ${-delta}%</span>`;
  return `<span class="cbt-delta flat" title="No change">– 0%</span>`;
}

function cardBody(e) {
  const rows = [];
  rows.push(bodyRow('Situation', e.situation));
  rows.push(bodyRow('Automatic thought(s)', e.thoughts));
  if (e.emotion || e.before !== null) {
    const v = `${esc(e.emotion) || '—'}${e.before !== null ? ` · ${e.before}%` : ''}`;
    rows.push(`<div class="cbt-row"><div class="cbt-rk">Emotion (before)</div><div class="cbt-rv">${v}</div></div>`);
  }
  rows.push(bodyRow('Evidence for', e.evidenceFor));
  rows.push(bodyRow('Evidence against', e.evidenceAgainst));
  rows.push(bodyRow('Balanced thought', e.balanced));
  if (e.after !== null) {
    rows.push(`<div class="cbt-row"><div class="cbt-rk">Emotion (after)</div><div class="cbt-rv">${e.after}%</div></div>`);
  }
  return rows.filter(Boolean).join('') + footNote(e);
}

function bodyRow(label, value) {
  if (!value) return '';
  return `<div class="cbt-row"><div class="cbt-rk">${label}</div><div class="cbt-rv">${esc(value)}</div></div>`;
}

function footNote(e) {
  const delta = intensityDelta(e.before, e.after);
  if (delta === null) return '';
  const msg = delta > 0
    ? `Nicely done — that emotion eased from ${e.before}% to ${e.after}%. 🌿`
    : delta < 0
      ? `It rose a little (${e.before}% → ${e.after}%). That's okay — naming it still helps. 💛`
      : `Held steady (${e.before}%). Some thoughts take more than one pass. 🌱`;
  return `<div class="cbt-foot">${msg}</div>`;
}

// Design principle 5: self-help disclaimer + crisis-resource pointer, always visible.
function disclaimerHTML() {
  return `
    <div class="jr-disc">
      <b>A self-help tool, not a substitute for professional care.</b>
      Thought records are a CBT self-help technique, not therapy or diagnosis. If you're
      struggling or in crisis, please reach out — e.g. <b>Tele-MANAS 14416</b> (India, 24×7)
      or your local emergency number. Your records stay private on this device.
    </div>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
