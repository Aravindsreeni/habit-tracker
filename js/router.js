// ── router.js — destination switch + view registry ─────────────────
import { refreshIcons } from './icons.js';

const _views  = {};          // viewId → { panelId, renderFn }
const _dests  = {};          // dest   → [viewId, ...]

export function registerView(viewId, panelId, renderFn) {
  _views[viewId] = { panelId, renderFn };
}

export function registerDest(dest, viewIds) {
  _dests[dest] = viewIds;
}

export function sw(dest) {
  // Show only the target destination
  document.querySelectorAll('[data-dest-panel]').forEach(p => {
    p.hidden = p.dataset.destPanel !== dest;
  });
  // Update tab bar aria-selected
  document.querySelectorAll('.grv-tab[data-dest]').forEach(b => {
    b.setAttribute('aria-selected', b.dataset.dest === dest ? 'true' : 'false');
  });
  // Render all views registered for this destination
  (_dests[dest] || []).forEach(id => _views[id]?.renderFn?.());
  refreshIcons();
}

// Expose globally for inline onclick="sw('today')" in the tab bar
window.sw = sw;
