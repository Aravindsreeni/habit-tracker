// ── cbt.js — CBT Thought Record + ABC(DE) + distortions (B6.3–B6.4) ─
// Two evidence-based cognitive-restructuring frames in one log (`ht_cbt`):
//   • Beck's 7-column thought record — situation → automatic thought →
//     emotion+intensity → evidence for/against → balanced thought → re-rate.
//   • Ellis REBT ABC(DE) — Activating event → Beliefs → Consequences →
//     Disputation → Effective new belief → re-rate.
// An optional 13-item cognitive-distortions checklist names the unhelpful
// thinking patterns at play. Completing a record typically eases emotion
// intensity ~20–40% (see CLAUDE.md evidence table).
// Self-help tool, NOT a substitute for professional care (disclaimer below).
import { CBT, setCBT, svCBT } from '../store.js';
import { xSVG } from '../ui.js';

// 13 cognitive distortions (Beck/Burns; confirmed vs simplypsychology.org /
// healthline.com). id · short label · one-line plain example.
const DISTORTIONS = [
  { id: 'all-or-nothing',  label: 'All-or-nothing',
    ex: 'Seeing things in black-and-white — "If it\'s not perfect, I failed."' },
  { id: 'catastrophizing', label: 'Catastrophizing',
    ex: 'Expecting the worst — "This will be a total disaster."' },
  { id: 'overgeneralization', label: 'Overgeneralization',
    ex: 'One event becomes a never-ending pattern — "I always mess this up."' },
  { id: 'mental-filter',   label: 'Mental filter',
    ex: 'Dwelling on a single negative and ignoring the rest.' },
  { id: 'mind-reading',    label: 'Mind-reading',
    ex: 'Assuming you know what others think — "They think I\'m boring."' },
  { id: 'labeling',        label: 'Labeling',
    ex: 'Attaching a fixed label to yourself — "I\'m a loser."' },
  { id: 'emotional-reasoning', label: 'Emotional reasoning',
    ex: 'Treating a feeling as fact — "I feel useless, so I must be."' },
  { id: 'discounting-positive', label: 'Discounting the positive',
    ex: 'Brushing off good things — "That win doesn\'t count."' },
  { id: 'fortune-telling', label: 'Fortune-telling',
    ex: 'Predicting the future negatively — "I\'ll definitely fail."' },
  { id: 'personalization', label: 'Personalization',
    ex: 'Blaming yourself for things outside your control.' },
  { id: 'should-statements', label: 'Should statements',
    ex: 'Rigid rules — "I should / must / have to…" that fuel guilt.' },
  { id: 'magnification',   label: 'Magnification / minimization',
    ex: 'Blowing up flaws, shrinking strengths.' },
  { id: 'blaming',         label: 'Blaming',
    ex: 'Holding others wholly at fault, ignoring your part (or vice-versa).' }
];
const DISTORTION_IDS = DISTORTIONS.map(d => d.id);

// Per-framework labels/placeholders for the shared text fields. The same
// storage keys are reused where the two models map cleanly (situation≈A,
// thoughts≈B, emotion≈C, balanced≈E); `disputation` is abcde-only.
const LABELS = {
  beck: {
    situation:       { label: 'Situation',
                       ph: 'What happened? Where and when?' },
    thoughts:        { label: 'Automatic thought(s)',
                       ph: 'What went through your mind? What did it mean to you?' },
    emotion:         { label: 'Emotion(s) & intensity now' },
    evidenceFor:     { label: 'Evidence for the thought',
                       ph: 'Facts that seem to support the thought…' },
    evidenceAgainst: { label: 'Evidence against the thought',
                       ph: "Facts that don't fit it, or another way to see it…" },
    balanced:        { label: 'Balanced / alternative thought',
                       ph: 'A fairer, more rounded way to look at it…' },
    after:           { label: 'Re-rate that emotion now' }
  },
  abcde: {
    situation:       { label: 'A · Activating event',
                       ph: 'What triggered this? The event or situation, just the facts.' },
    thoughts:        { label: 'B · Beliefs',
                       ph: 'What did you tell yourself about it? Your beliefs and self-talk.' },
    emotion:         { label: 'C · Consequences — emotion & intensity' },
    disputation:     { label: 'D · Disputation',
                       ph: 'Challenge the belief — is it true? helpful? logical? What would you tell a friend?' },
    balanced:        { label: 'E · Effective new belief',
                       ph: 'A more useful, rational belief to carry forward.' },
    after:           { label: 'Re-rate that emotion now' }
  }
};

// Which text fields each framework shows, in order, between the emotion block.
const FORM = {
  beck:  { pre: ['situation', 'thoughts'], post: ['evidenceFor', 'evidenceAgainst', 'balanced'] },
  abcde: { pre: ['situation', 'thoughts'], post: ['disputation', 'balanced'] }
};

// ── Pure logic (node-tested) ──
// Coerce any stored shape into a complete, safe record (either model).
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
    // Discriminator: 'abcde' only when explicitly set; everything else (incl.
    // legacy untagged records) defaults to 'beck' so old entries still render.
    model:           o.model === 'abcde' ? 'abcde' : 'beck',
    situation:       str(o.situation),
    thoughts:        str(o.thoughts),
    emotion:         str(o.emotion),
    before:          pct(o.before),
    evidenceFor:     str(o.evidenceFor),
    evidenceAgainst: str(o.evidenceAgainst),
    disputation:     str(o.disputation),
    balanced:        str(o.balanced),
    after:           pct(o.after),
    // Keep only known distortion ids, de-duplicated, in canonical order.
    distortions:     Array.isArray(o.distortions)
      ? DISTORTION_IDS.filter(id => o.distortions.includes(id))
      : []
  };
}

// Drop in intensity after restructuring; positive = emotion eased. null if unrated. Pure.
export function intensityDelta(before, after) {
  if (typeof before !== 'number' || typeof after !== 'number') return null;
  return before - after;
}

// Worth saving if there's at least a situation/event or a thought/belief. Pure.
export function hasContent(entry) {
  const e = normalizeCbt(entry);
  return !!(e.situation || e.thoughts);
}

// ── View state ──
let formOpen   = false;
let openId     = null;
let formModel  = 'beck';            // active framework on the New-record form
let formDraft  = {};                // preserved across a model toggle
let selDist    = new Set();         // selected distortion ids on the form

// ── Render ──
export function render() {
  const el = document.getElementById('p-cbt');
  if (!el) return;

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">Thought records${CBT.length ? ` · ${CBT.length}` : ''}</span>
      <button class="sec-add" id="cbt-new">${formOpen ? 'Close' : '+ New record'}</button>
    </div>
    <div class="cbt-intro">Untangle a tough moment: name the thought, weigh it, and find a steadier one. Two frames — pick whichever fits.</div>
    <div id="cbt-form"></div>
    <div id="cbt-list"></div>
    ${disclaimerHTML()}`;

  el.querySelector('#cbt-new')?.addEventListener('click', () => {
    formOpen = !formOpen;
    if (formOpen) { formDraft = {}; selDist = new Set(); }   // fresh form
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

  const L = LABELS[formModel];
  const cfg = FORM[formModel];

  host.innerHTML = `
    <div class="cbt-card cbt-formcard">
      <div class="cbt-modes" role="tablist">
        <button class="cbt-mode${formModel === 'beck'  ? ' on' : ''}" data-model="beck">Thought record</button>
        <button class="cbt-mode${formModel === 'abcde' ? ' on' : ''}" data-model="abcde">ABC(DE)</button>
      </div>
      <div class="cbt-mode-hint">${formModel === 'beck'
        ? "Beck's 7-column worksheet — weigh the evidence for and against the thought."
        : 'Ellis REBT — dispute the belief behind the feeling, then form an effective new one.'}</div>
      ${cfg.pre.map(k => field(k, L)).join('')}
      ${distortionsBlock()}
      <div class="cbt-fld">
        <label class="cbt-lbl">${L.emotion.label}</label>
        <div class="cbt-emorow">
          <input class="fi" id="cbt-emotion" type="text" placeholder="e.g. anxious, ashamed" maxlength="120" value="${esc(formDraft.emotion || '')}">
          <input class="fnum" id="cbt-before" type="number" min="0" max="100" placeholder="%" value="${esc(formDraft.before || '')}">
        </div>
      </div>
      ${cfg.post.map(k => field(k, L)).join('')}
      <div class="cbt-fld">
        <label class="cbt-lbl">${L.after.label}</label>
        <input class="fnum" id="cbt-after" type="number" min="0" max="100" placeholder="%" value="${esc(formDraft.after || '')}">
      </div>
      <div class="fact">
        <button class="fcx" id="cbt-cancel">Cancel</button>
        <button class="fsv" id="cbt-save">Save record</button>
      </div>
    </div>`;

  host.querySelectorAll('[data-model]').forEach(b =>
    b.addEventListener('click', () => {
      const m = b.getAttribute('data-model');
      if (m === formModel) return;
      _collectDraft();                 // keep what's been typed across the switch
      formModel = m;
      _renderForm();
    }));
  host.querySelectorAll('[data-dist]').forEach(b =>
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-dist');
      if (selDist.has(id)) selDist.delete(id); else selDist.add(id);
      b.classList.toggle('on');
      b.setAttribute('aria-pressed', selDist.has(id) ? 'true' : 'false');
    }));
  host.querySelector('#cbt-save')?.addEventListener('click', _save);
  host.querySelector('#cbt-cancel')?.addEventListener('click', () => {
    formOpen = false; formDraft = {}; selDist = new Set(); render();
  });
}

function field(key, L) {
  const col = L[key];
  return `
    <div class="cbt-fld">
      <label class="cbt-lbl">${col.label}</label>
      <textarea class="rta" id="cbt-${key}" maxlength="1000" placeholder="${esc(col.ph)}">${esc(formDraft[key] || '')}</textarea>
    </div>`;
}

// Optional multi-select checklist of unhelpful thinking patterns.
function distortionsBlock() {
  const chips = DISTORTIONS.map(d =>
    `<button type="button" class="cbt-chip${selDist.has(d.id) ? ' on' : ''}" data-dist="${d.id}"
       aria-pressed="${selDist.has(d.id) ? 'true' : 'false'}" title="${esc(d.ex)}">${esc(d.label)}</button>`
  ).join('');
  return `
    <div class="cbt-fld">
      <label class="cbt-lbl">Thinking patterns <span class="cbt-lbl-opt">— optional, tap any that fit</span></label>
      <div class="cbt-chips">${chips}</div>
    </div>`;
}

// Snapshot current inputs so a model toggle doesn't lose typed text.
function _collectDraft() {
  const val = id => document.getElementById(id)?.value ?? '';
  formDraft = {
    situation:       val('cbt-situation'),
    thoughts:        val('cbt-thoughts'),
    emotion:         val('cbt-emotion'),
    before:          val('cbt-before'),
    evidenceFor:     val('cbt-evidenceFor'),
    evidenceAgainst: val('cbt-evidenceAgainst'),
    disputation:     val('cbt-disputation'),
    balanced:        val('cbt-balanced'),
    after:           val('cbt-after')
  };
}

function _save() {
  _collectDraft();
  const draft = { ...formDraft, model: formModel, distortions: [...selDist] };
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
  formDraft = {};
  selDist = new Set();
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
      <span class="cbt-tagline">${e.model === 'abcde' ? 'ABC(DE)' : 'CBT'}</span>
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
  if (e.model === 'abcde') {
    rows.push(bodyRow('A · Activating event', e.situation));
    rows.push(bodyRow('B · Beliefs', e.thoughts));
    rows.push(distortionTags(e));
    rows.push(emotionRow('C · Consequences (before)', e));
    rows.push(bodyRow('D · Disputation', e.disputation));
    rows.push(bodyRow('E · Effective new belief', e.balanced));
  } else {
    rows.push(bodyRow('Situation', e.situation));
    rows.push(bodyRow('Automatic thought(s)', e.thoughts));
    rows.push(distortionTags(e));
    rows.push(emotionRow('Emotion (before)', e));
    rows.push(bodyRow('Evidence for', e.evidenceFor));
    rows.push(bodyRow('Evidence against', e.evidenceAgainst));
    rows.push(bodyRow('Balanced thought', e.balanced));
  }
  if (e.after !== null) {
    rows.push(`<div class="cbt-row"><div class="cbt-rk">Emotion (after)</div><div class="cbt-rv">${e.after}%</div></div>`);
  }
  return rows.filter(Boolean).join('') + footNote(e);
}

function emotionRow(label, e) {
  if (!e.emotion && e.before === null) return '';
  const v = `${esc(e.emotion) || '—'}${e.before !== null ? ` · ${e.before}%` : ''}`;
  return `<div class="cbt-row"><div class="cbt-rk">${label}</div><div class="cbt-rv">${v}</div></div>`;
}

function distortionTags(e) {
  if (!e.distortions.length) return '';
  const tags = e.distortions.map(id => {
    const d = DISTORTIONS.find(x => x.id === id);
    return d ? `<span class="cbt-tag" title="${esc(d.ex)}">${esc(d.label)}</span>` : '';
  }).filter(Boolean).join('');
  if (!tags) return '';
  return `<div class="cbt-row"><div class="cbt-rk">Thinking patterns</div><div class="cbt-tags">${tags}</div></div>`;
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
      Thought records (CBT) and the ABC(DE) model (REBT) are self-help techniques, not therapy
      or diagnosis. If you're struggling or in crisis, please reach out — e.g.
      <b>Tele-MANAS 14416</b> (India, 24×7) or your local emergency number. Your records stay
      private on this device.
    </div>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
