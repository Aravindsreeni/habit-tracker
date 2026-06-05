// ── notes.js — shared note toggle + save (used by all habit views) ─
import { D, W, M, Q, Y, sv } from '../store.js';
import { openNote } from '../ui.js';

// Toggle note panel open/closed
export function tr(key) { openNote(key); }

// Save note on blur; section = 'daily'|'weekly'|'monthly'
export function sR(section, id, v) {
  const map = { daily: D, weekly: W, monthly: M, quarterly: Q, yearly: Y };
  const obj = map[section];
  if (!obj) return;
  if (!obj.remarks) obj.remarks = {};
  obj.remarks[id] = v;
  sv(section);
  const b = document.getElementById(`rb-${id}`);
  if (b) b.classList.toggle('noted', v && v.length > 0);
}

// Wire note events on a container element (call after each render)
export function wireNotes(container, section) {
  container.querySelectorAll('[data-note-id]').forEach(btn => {
    btn.onclick = () => tr(btn.dataset.noteId);
  });
  container.querySelectorAll('[data-note-section]').forEach(ta => {
    ta.onblur = () => sR(ta.dataset.noteSection, ta.dataset.noteHabit, ta.value);
  });
}

// Wire delete buttons
export function wireDel(container, delFn) {
  container.querySelectorAll('[data-del-section]').forEach(btn => {
    btn.onclick = () => delFn(btn.dataset.delSection, btn.dataset.delId);
  });
}
