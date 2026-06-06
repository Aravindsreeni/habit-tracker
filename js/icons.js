// ── icons.js — Lucide helpers ─────────────────────────────────────
// Lucide ships as a vendored UMD bundle on window.lucide (see index.html,
// loaded before app.js). icon() returns inline SVG markup so it can drop
// straight into template strings; refreshIcons() swaps any leftover
// <i data-lucide="…"> placeholders after a render().
//
// Grove voice: calm, rounded, 1.9px stroke (2.1px when "active").

const STROKE = 1.9;
const STROKE_ACTIVE = 2.1;

function toPascal(name) {
  return String(name)
    .split(/[-_\s]+/)
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ''))
    .join('');
}

function attrsToStr(o) {
  return Object.entries(o || {})
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
}

// Normalise a Lucide icon export into its child element descriptors.
// Format (lucide ≥0.4xx): ["svg", attrs, [["path",{…}], …]]
function toChildren(node) {
  if (!node) return null;
  if (typeof node[0] === 'string' && node[0] === 'svg' && Array.isArray(node[2])) return node[2];
  if (Array.isArray(node[0])) return node;
  return null;
}

/**
 * icon(name, opts) → inline <svg> string.
 * @param {string} name        kebab Lucide name, e.g. 'circle-check'
 * @param {object} [opts]
 * @param {number} [opts.size=20]
 * @param {number} [opts.stroke]   defaults 1.9 (2.1 when active=true)
 * @param {boolean}[opts.active]   thicker stroke for the selected state
 * @param {string} [opts.cls]      extra class names
 * @param {string} [opts.label]    accessible label (else aria-hidden)
 */
export function icon(name, opts = {}) {
  const { size = 20, active = false, cls = '', label } = opts;
  const stroke = opts.stroke != null ? opts.stroke : active ? STROKE_ACTIVE : STROKE;
  const lib = (typeof window !== 'undefined' && window.lucide && window.lucide.icons) || null;
  const children = toChildren(lib ? lib[toPascal(name)] : null);
  const inner = children ? children.map((c) => `<${c[0]} ${attrsToStr(c[1])}></${c[0]}>`).join('') : '';
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="grv-icon${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${inner}</svg>`;
}

/** Swap any <i data-lucide="…"> placeholders left in the DOM into SVGs. */
export function refreshIcons() {
  if (typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function') {
    try { window.lucide.createIcons(); } catch { /* offline / missing lib — ignore */ }
  }
}
