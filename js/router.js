// ── router.js — tab switch + view registry ─────────────────────────
import { refreshIcons } from './icons.js';

// Map of tab-id → { panel id, render fn }
const _views = {};

export function registerView(tabId, panelId, renderFn) {
  _views[tabId] = { panelId, renderFn };
}

export function sw(tab) {
  document.querySelectorAll('.tab').forEach(b =>
    b.classList.toggle('on', b.dataset.tab === tab)
  );
  document.querySelectorAll('.pnl').forEach(p => p.classList.remove('on'));
  const v = _views[tab];
  if (v) {
    document.getElementById(v.panelId)?.classList.add('on');
    v.renderFn?.();
    refreshIcons();   // swap any <i data-lucide> placeholders left by a render
  }
}

// Expose globally so inline onclick="sw(...)" still works during transition
window.sw = sw;
