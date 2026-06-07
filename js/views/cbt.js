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
import { t } from '../i18n.js';

// Distortion ids are stable identifiers; labels and examples are translated via t().
const DISTORTION_IDS = [
  'all_or_nothing', 'catastrophizing', 'overgeneralization', 'mental_filter',
  'mind_reading', 'labeling', 'emotional_reasoning', 'discounting_positive',
  'fortune_telling', 'personalization', 'should_statements', 'magnification', 'blaming'
];

// Legacy stored ids use hyphens; we map them to the underscore keys used in locales.
const ID_MAP = {
  'all-or-nothing': 'all_or_nothing',
  'catastrophizing': 'catastrophizing',
  'overgeneralization': 'overgeneralization',
  'mental-filter': 'mental_filter',
  'mind-reading': 'mind_reading',
  'labeling': 'labeling',
  'emotional-reasoning': 'emotional_reasoning',
  'discounting-positive': 'discounting_positive',
  'fortune-telling': 'fortune_telling',
  'personalization': 'personalization',
  'should-statements': 'should_statements',
  'magnification': 'magnification',
  'blaming': 'blaming',
};
// Canonical storage id (hyphenated, matching legacy data)
const STORAGE_ID = {
  'all_or_nothing': 'all-or-nothing',
  'catastrophizing': 'catastrophizing',
  'overgeneralization': 'overgeneralization',
  'mental_filter': 'mental-filter',
  'mind_reading': 'mind-reading',
  'labeling': 'labeling',
  'emotional_reasoning': 'emotional-reasoning',
  'discounting_positive': 'discounting-positive',
  'fortune_telling': 'fortune-telling',
  'personalization': 'personalization',
  'should_statements': 'should-statements',
  'magnification': 'magnification',
  'blaming': 'blaming',
};

// Build the DISTORTIONS array using translation keys
function distortions() {
  return DISTORTION_IDS.map(k => ({
    key: k,
    storageId: STORAGE_ID[k],
    label: t(`cbt.dist_${k}_label`),
    ex:    t(`cbt.dist_${k}_ex`),
  }));
}

// Labels/placeholders per framework, built fresh on each render call
function getLabels(model) {
  if (model === 'abcde') return {
    situation:   { label: t('cbt.abcde_situation_label'), ph: t('cbt.abcde_situation_ph') },
    thoughts:    { label: t('cbt.abcde_thoughts_label'),  ph: t('cbt.abcde_thoughts_ph')  },
    emotion:     { label: t('cbt.abcde_emotion_label') },
    disputation: { label: t('cbt.abcde_disp_label'),      ph: t('cbt.abcde_disp_ph')      },
    balanced:    { label: t('cbt.abcde_balanced_label'),  ph: t('cbt.abcde_balanced_ph')  },
    after:       { label: t('cbt.abcde_after_label') },
  };
  return {
    situation:       { label: t('cbt.beck_situation_label'),        ph: t('cbt.beck_situation_ph')        },
    thoughts:        { label: t('cbt.beck_thoughts_label'),         ph: t('cbt.beck_thoughts_ph')         },
    emotion:         { label: t('cbt.beck_emotion_label') },
    evidenceFor:     { label: t('cbt.beck_evidence_for_label'),     ph: t('cbt.beck_evidence_for_ph')     },
    evidenceAgainst: { label: t('cbt.beck_evidence_against_label'), ph: t('cbt.beck_evidence_against_ph') },
    balanced:        { label: t('cbt.beck_balanced_label'),         ph: t('cbt.beck_balanced_ph')         },
    after:           { label: t('cbt.beck_after_label') },
  };
}

const FORM = {
  beck:  { pre: ['situation', 'thoughts'], post: ['evidenceFor', 'evidenceAgainst', 'balanced'] },
  abcde: { pre: ['situation', 'thoughts'], post: ['disputation', 'balanced'] }
};

// ── Pure logic (node-tested) ──
export function normalizeCbt(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const str = v => (typeof v === 'string' ? v.trim() : '');
  const pct = v => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
  };
  // Normalise stored distortion ids to underscore form for locale lookup
  const rawDists = Array.isArray(o.distortions) ? o.distortions : [];
  const normDists = rawDists
    .map(id => ID_MAP[id] || id)
    .filter(id => DISTORTION_IDS.includes(id));
  return {
    id:        typeof o.id === 'string' ? o.id : '',
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : '',
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
    distortions:     normDists,
  };
}

export function intensityDelta(before, after) {
  if (typeof before !== 'number' || typeof after !== 'number') return null;
  return before - after;
}

export function hasContent(entry) {
  const e = normalizeCbt(entry);
  return !!(e.situation || e.thoughts);
}

// ── View state ──
let formOpen   = false;
let openId     = null;
let formModel  = 'beck';
let formDraft  = {};
let selDist    = new Set();   // underscore-key ids

// ── Render ──
export function render() {
  const el = document.getElementById('p-cbt');
  if (!el) return;

  const hdr = CBT.length
    ? t('cbt.header_count', { n: CBT.length })
    : t('cbt.header_base');

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">${hdr}</span>
      <button class="sec-add" id="cbt-new">${formOpen ? t('cbt.btn_close') : t('cbt.btn_new')}</button>
    </div>
    <div class="cbt-intro">${t('cbt.intro')}</div>
    <div id="cbt-form"></div>
    <div id="cbt-list"></div>
    <div class="jr-disc">${t('cbt.disclaimer')}</div>`;

  el.querySelector('#cbt-new')?.addEventListener('click', () => {
    formOpen = !formOpen;
    if (formOpen) { formDraft = {}; selDist = new Set(); }
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

  const L   = getLabels(formModel);
  const cfg = FORM[formModel];

  host.innerHTML = `
    <div class="cbt-card cbt-formcard">
      <div class="cbt-modes" role="tablist">
        <button class="cbt-mode${formModel === 'beck'  ? ' on' : ''}" data-model="beck">${t('cbt.mode_beck')}</button>
        <button class="cbt-mode${formModel === 'abcde' ? ' on' : ''}" data-model="abcde">${t('cbt.mode_abcde')}</button>
      </div>
      <div class="cbt-mode-hint">${formModel === 'beck' ? t('cbt.hint_beck') : t('cbt.hint_abcde')}</div>
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
        <button class="fcx" id="cbt-cancel">${t('common.cancel')}</button>
        <button class="fsv" id="cbt-save">${t('cbt.btn_save')}</button>
      </div>
    </div>`;

  host.querySelectorAll('[data-model]').forEach(b =>
    b.addEventListener('click', () => {
      const m = b.getAttribute('data-model');
      if (m === formModel) return;
      _collectDraft();
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

function distortionsBlock() {
  const chips = distortions().map(d =>
    `<button type="button" class="cbt-chip${selDist.has(d.key) ? ' on' : ''}" data-dist="${d.key}"
       aria-pressed="${selDist.has(d.key) ? 'true' : 'false'}" title="${esc(d.ex)}">${esc(d.label)}</button>`
  ).join('');
  return `
    <div class="cbt-fld">
      <label class="cbt-lbl">${t('cbt.dist_header')} <span class="cbt-lbl-opt">${t('cbt.dist_hint')}</span></label>
      <div class="cbt-chips">${chips}</div>
    </div>`;
}

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
  // Convert underscore-key selDist to hyphenated storage ids for backward compat
  const storeDists = [...selDist].map(k => STORAGE_ID[k] || k);
  const draft = { ...formDraft, model: formModel, distortions: storeDists };
  if (!hasContent(draft)) {
    document.getElementById('cbt-situation')?.focus();
    import('../ui.js').then(m => m.toast(t('cbt.toast_empty'), false));
    return;
  }
  const entry = normalizeCbt(draft);
  // Persist with hyphenated ids (legacy format)
  entry.distortions = storeDists.filter(id => Object.values(STORAGE_ID).includes(id));
  entry.id = 'c' + Date.now();
  entry.createdAt = new Date().toISOString();
  setCBT([entry, ...CBT]);
  svCBT();
  formOpen = false;
  formDraft = {};
  selDist = new Set();
  openId = entry.id;
  render();
  import('../ui.js').then(m => m.toast(t('cbt.toast_saved')));
}

// ── List (newest first, tap to expand) ──
function _renderList() {
  const host = document.getElementById('cbt-list');
  if (!host) return;
  if (!CBT.length) {
    host.innerHTML = `<div class="empty">${t('cbt.empty')}</div>`;
    return;
  }
  host.innerHTML = '';
  CBT.map(normalizeCbt).forEach(e => host.appendChild(_card(e)));
}

function _card(e) {
  const open  = openId === e.id;
  const delta = intensityDelta(e.before, e.after);
  const title = e.situation || e.thoughts || t('cbt.header_base');
  const c = document.createElement('div');
  c.className = `hc cbt-card${open ? ' on' : ''}`;
  c.innerHTML = `
    <div class="hr cbt-hdr" data-cbt-open="${e.id}">
      <span class="cbt-tagline">${e.model === 'abcde' ? 'ABC(DE)' : 'CBT'}</span>
      <span class="hn">${esc(title)}</span>
      ${deltaBadge(delta)}
      <button class="hdel" title="${t('common.delete')}" data-cbt-del="${e.id}">${xSVG()}</button>
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
    rows.push(bodyRow(t('cbt.row_a'), e.situation));
    rows.push(bodyRow(t('cbt.row_b'), e.thoughts));
    rows.push(distortionTags(e));
    rows.push(emotionRow(t('cbt.row_c'), e));
    rows.push(bodyRow(t('cbt.row_d'), e.disputation));
    rows.push(bodyRow(t('cbt.row_e'), e.balanced));
  } else {
    rows.push(bodyRow(t('cbt.row_situation'), e.situation));
    rows.push(bodyRow(t('cbt.row_thoughts'), e.thoughts));
    rows.push(distortionTags(e));
    rows.push(emotionRow(t('cbt.row_emotion_before'), e));
    rows.push(bodyRow(t('cbt.row_evidence_for'), e.evidenceFor));
    rows.push(bodyRow(t('cbt.row_evidence_against'), e.evidenceAgainst));
    rows.push(bodyRow(t('cbt.row_balanced'), e.balanced));
  }
  if (e.after !== null) {
    rows.push(`<div class="cbt-row"><div class="cbt-rk">${t('cbt.row_emotion_after')}</div><div class="cbt-rv">${e.after}%</div></div>`);
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
  // e.distortions may be stored as hyphenated ids; normalise for locale lookup
  const tags = e.distortions.map(id => {
    const key = ID_MAP[id] || id;
    const label = t(`cbt.dist_${key}_label`);
    const ex    = t(`cbt.dist_${key}_ex`);
    return label !== `cbt.dist_${key}_label`
      ? `<span class="cbt-tag" title="${esc(ex)}">${esc(label)}</span>`
      : '';
  }).filter(Boolean).join('');
  if (!tags) return '';
  return `<div class="cbt-row"><div class="cbt-rk">${t('cbt.row_thinking')}</div><div class="cbt-tags">${tags}</div></div>`;
}

function bodyRow(label, value) {
  if (!value) return '';
  return `<div class="cbt-row"><div class="cbt-rk">${label}</div><div class="cbt-rv">${esc(value)}</div></div>`;
}

function footNote(e) {
  const delta = intensityDelta(e.before, e.after);
  if (delta === null) return '';
  let msg;
  if      (delta > 0) msg = t('cbt.foot_eased',  { before: e.before, after: e.after });
  else if (delta < 0) msg = t('cbt.foot_rose',   { before: e.before, after: e.after });
  else                msg = t('cbt.foot_steady', { before: e.before });
  return `<div class="cbt-foot">${msg}</div>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
