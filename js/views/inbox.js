// ── inbox.js — Brain-Dump / Inbox view ────────────────────────────
// Frictionless thought/task capture. Items can be converted to Quick Wins.
import { INBOX, setInbox, svInbox, QW, sv } from '../store.js';
import { xSVG, penSVG, ckSVG } from '../ui.js';
import { t } from '../i18n.js';

let noteOpenId = null;

export function render() {
  const el = document.getElementById('p-inbox');
  if (!el) return;

  const count = INBOX.filter(i => !i.done).length;
  const hdr   = count ? t('inbox.header_count', { count }) : t('inbox.header_base');

  el.innerHTML = `
    <div class="sec-hdr" style="margin-top:4px">
      <span class="sec-lbl">${hdr}</span>
    </div>
    <div class="inb-add-row">
      <input class="fi" id="inb-inp" type="text" placeholder="${t('inbox.ph')}" autocomplete="off">
      <button class="fsv" id="inb-addbtn">${t('common.add')}</button>
    </div>
    <div id="inb-list"></div>`;

  _renderList();

  const inp = el.querySelector('#inb-inp');
  inp?.addEventListener('keydown', e => { if (e.key === 'Enter') _add(); });
  el.querySelector('#inb-addbtn')?.addEventListener('click', _add);
}

function _renderList() {
  const listEl = document.getElementById('inb-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!INBOX.length) {
    listEl.innerHTML = `<div class="empty">${t('inbox.empty')}</div>`;
    return;
  }

  [...INBOX].reverse().forEach(item => {
    const c = document.createElement('div');
    c.className = `hc inb-card${item.done ? ' done' : ''}`;
    c.innerHTML = `
      <div class="hr">
        <span class="hn${item.done ? ' sk' : ''}">${_esc(item.text)}</span>
        <button class="qk${item.done ? ' dn' : ''}" title="${t('common.done')}" data-inb-done="${item.id}">${item.done ? ckSVG() : ''}</button>
        <button class="rnb${item.note ? ' noted' : ''}" title="${t('common.edit')}" data-inb-note="${item.id}">${penSVG()}</button>
        <button class="fsv inb-conv" title="${t('inbox.convert')}" data-inb-conv="${item.id}" style="font-size:11px;padding:2px 7px">${t('inbox.convert')}</button>
        <button class="hdel" title="${t('common.delete')}" data-inb-del="${item.id}">${xSVG()}</button>
      </div>
      <div class="ra${noteOpenId === item.id ? ' on' : ''}" id="inb-ra-${item.id}">
        <textarea class="rta" placeholder="${t('inbox.note_ph')}" data-inb-note-save="${item.id}">${_esc(item.note || '')}</textarea>
      </div>`;
    listEl.appendChild(c);
  });

  listEl.querySelectorAll('[data-inb-done]').forEach(btn => {
    btn.onclick = () => {
      const item = INBOX.find(i => i.id === btn.dataset.inbDone);
      if (item) { item.done = !item.done; svInbox(); render(); }
    };
  });
  listEl.querySelectorAll('[data-inb-note]').forEach(btn => {
    btn.onclick = () => {
      noteOpenId = noteOpenId === btn.dataset.inbNote ? null : btn.dataset.inbNote;
      _renderList();
      if (noteOpenId) {
        setTimeout(() => {
          document.getElementById(`inb-ra-${noteOpenId}`)?.querySelector('textarea')?.focus();
        }, 30);
      }
    };
  });
  listEl.querySelectorAll('[data-inb-note-save]').forEach(ta => {
    ta.onblur = () => {
      const item = INBOX.find(i => i.id === ta.dataset.inbNoteSave);
      if (item) { item.note = ta.value; svInbox(); }
      const btn = listEl.querySelector(`[data-inb-note="${ta.dataset.inbNoteSave}"]`);
      if (btn) btn.classList.toggle('noted', !!ta.value);
    };
  });
  listEl.querySelectorAll('[data-inb-conv]').forEach(btn => {
    btn.onclick = () => _convertToTask(btn.dataset.inbConv);
  });
  listEl.querySelectorAll('[data-inb-del]').forEach(btn => {
    btn.onclick = () => {
      setInbox(INBOX.filter(i => i.id !== btn.dataset.inbDel));
      if (noteOpenId === btn.dataset.inbDel) noteOpenId = null;
      svInbox(); render();
    };
  });
}

function _add() {
  const inp = document.getElementById('inb-inp');
  const text = inp?.value.trim();
  if (!text) return;
  INBOX.push({ id: 'i' + Date.now(), text, note: '', done: false, createdAt: new Date().toISOString() });
  svInbox();
  inp.value = '';
  render();
  inp.focus();
}

function _convertToTask(id) {
  const item = INBOX.find(i => i.id === id);
  if (!item) return;
  QW.push({ id: 'q' + Date.now(), task: item.text, effort: '10', status: 'pending' });
  sv('q');
  setInbox(INBOX.filter(i => i.id !== id));
  svInbox();
  render();
  import('../ui.js').then(m => m.toast(t('inbox.converted')));
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
