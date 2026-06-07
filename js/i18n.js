// ── i18n.js — lightweight key-based localisation engine ─────────────
// No dependencies. Locale modules live in js/locales/.
// Call await initLang() once at bootstrap (top-level await in app.js)
// before any view renders — after that t() is fully synchronous.

let _s = {};   // active locale strings (set by initLang)

// Look up a dot-separated key in _s; substitute {token} placeholders.
// Falls back to the key string itself when a key is missing, so a
// missing translation is always visible rather than silently blank.
export function t(key, vars = {}) {
  const raw = key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), _s);
  const str = (raw !== undefined && raw !== null) ? String(raw) : key;
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), str);
}

// Return the singular or plural form based on count n.
export function plural(n, one, other) { return n === 1 ? one : other; }

// Load a locale by code; if no argument, reads ht_settings.lang from
// localStorage (defaults 'en'). Called with top-level await in app.js.
export async function initLang(lang) {
  if (!lang) {
    try {
      const saved = JSON.parse(localStorage.getItem('ht_settings') || '{}');
      lang = saved.lang || 'en';
    } catch { lang = 'en'; }
  }
  try {
    const mod = await import(`./locales/${lang}.js`);
    _s = mod.default;
  } catch {
    // Locale file failed — fall back to English rather than showing raw keys
    if (lang !== 'en') {
      try {
        const mod = await import('./locales/en.js');
        _s = mod.default;
      } catch { /* leave _s empty; t() will return key strings */ }
    }
  }
}

export function getLang() { return _s._lang ?? 'en'; }
