# CLAUDE.md — Habit Tracker / Routine & Wellbeing OS

*Auto-loaded context for every Claude Code session on this repo.*
*Session state / "resume here": see `progress.md`*

---

## Stack & hard rules

- **Vanilla HTML + CSS + JS only.** No bundler, no transpiler, no npm, no `node_modules`.
- **ES modules** (`<script type="module">`). Import with relative paths (`.js` extension required in browsers).
- **GitHub Pages** serves the **repo root** of `main`. Keep `index.html` at root. No CI/Actions needed.
- **Local dev server required** for ES modules (file:// won't work):
  ```
  python -m http.server 8000   # then open http://localhost:8000/
  ```
  Or `npx serve .` if Node is available.
- **No build step** means no tree-shaking — keep code lean; split into focused modules.
- Long-term mobile target: **Capacitor** wraps these exact files for iOS/Android. Keep DOM-centric, no
  bundler-only idioms.

---

## Module map (current — post-Grove re-skin, Phases 9–15)

```
index.html              ← app shell; 5 [data-dest-panel] divs + Grove bottom tabbar
manifest.webmanifest
sw.js                   ← app-shell cache; bump CACHE const on every shell-file change (currently ht-v22)
icons/                  ← PWA icons
css/
  grove/                ← Grove design system (vendored; tokens, fonts, components)
    styles.css          ← main Grove entry (imports tokens + components)
    tokens/             ← colors.css, typography.css, spacing.css, elevation.css, motion.css
    fonts/              ← fonts.css + woff2 files (Newsreader, Hanken Grotesk, Spline Sans Mono)
    components/
      grove-ui.css      ← .grv-card, .grv-check, .grv-seg, .grv-progress, .grv-badge,
                           .grv-tabbar/.grv-tab, .grv-btn, .grv-iconbtn
  tokens.css            ← legacy var aliases (--bg, --s, --card, etc.) mapped onto Grove tokens
  base.css              ← layout, forms, per-feature legacy styles (.hc, .hm-*, .mf-*, .cbt-*, …)
  grove-app.css         ← ported kit layout (.screen, .scr-head, .scr-eyebrow, .scr-greet,
                           .sec-eyebrow, .tabhost, .hero*, .ring*, .counter*, .breathe-*, etc.)
js/
  app.js                ← bootstrap: init → register 5 destination views → sw('today')
  store.js              ← state, localStorage, schema v3, migration, date-key helpers, goal-linking
  sync.js               ← Google Drive OAuth + full-history payload + Export/Import JSON
  ui.js                 ← toast(), mkCard(), mkSum(), SVG helpers
  router.js             ← registerView/registerDest/sw(); toggles [data-dest-panel] hidden attrs
  icons.js              ← icon(name, opts) → SVG string; refreshIcons() → lucide.createIcons()
  reminders.js          ← recurring timer engine + Notification API, native-aware
  vendor/
    lucide.min.js       ← vendored Lucide icon UMD (0.453.0)
  views/
    today.js            ← Today destination (ring, habits, routine, quick wins) — self-contained
    habits.js           ← Habits destination (segmented Daily/Weekly/Monthly/Quarterly/Yearly)
    reflect.js          ← Reflect destination wrapper → mood.js / journal.js / cbt.js / inbox.js
    calm.js             ← Calm destination wrapper → mindfulness.js (timer-safe re-render guard)
    you.js              ← You destination wrapper → stats.js / settings.js + sync section
    daily.js            ← legacy daily view (no-op if #p-daily absent; null guard)
    weekly.js           ← legacy weekly view (null guard)
    monthly.js          ← legacy monthly view (null guard)
    quarterly.js        ← legacy quarterly view (null guard)
    yearly.js           ← legacy yearly view (null guard)
    tasks.js            ← quick wins (null guard; rendered by today.js)
    inbox.js            ← brain-dump (rendered inside reflect.js → #p-inbox)
    routine.js          ← routine (rendered by today.js; null guard)
    stats.js            ← streaks, heatmap, rates, areas (rendered by you.js → #p-stats)
    settings.js         ← theme, reminders (rendered by you.js → #p-settings)
    journal.js          ← Three Good Things journal (rendered by reflect.js → #p-journal)
    mood.js             ← daily mood check-in (rendered by reflect.js → #p-mood)
    cbt.js              ← CBT thought records + ABC(DE) (rendered by reflect.js → #p-cbt)
    mindfulness.js      ← breathing pacer + meditation timer (rendered by calm.js → #p-mindfulness)
    notes.js            ← shared note-editing behaviour (used by legacy views)
    _all.js             ← renderAll() — calls the 5 destination wrappers (used by sync restore)
assets/grove/           ← Grove brand SVGs (grove-icon.svg, grove-mark.svg, etc.)
native/                 ← Capacitor iOS/Android wrapper (see native/README.md)
grove-design/           ← Grove design system source (UNTRACKED — reference only, not app code)
```

---

## 5-destination IA (post-Grove)

| Destination | Tab icon | Panel ID | Wrapper | Sub-views |
|---|---|---|---|---|
| **Today** | sun | `p-today` | `today.js` | inline (habits + routine + quick wins) |
| **Habits** | circle-check | `p-habits` | `habits.js` | inline (all 5 horizons) |
| **Reflect** | book-open | `p-reflect` | `reflect.js` | mood.js · journal.js · cbt.js · inbox.js |
| **Calm** | wind | `p-calm` | `calm.js` | mindfulness.js |
| **You** | bar-chart-3 | `p-you` | `you.js` | stats.js · settings.js |

**Router pattern:** `registerView(id, panelId, renderFn)` + `registerDest(dest, [viewIds])` +
`sw(dest)` toggles `[data-dest-panel]` hidden attrs and calls each registered render fn.

**Wrapper render cycle:** each wrapper's `render()` sets `el.innerHTML` (creating sub-containers
by ID), then calls the sub-view render functions. Sub-views find their containers via
`document.getElementById` and render their own content into them.

**`calm.js` guard:** checks `el.querySelector('#p-mindfulness')` before re-rendering — prevents
destroying an active breathing/meditation timer session.

---

## Storage keys (localStorage)

| Key pattern | Content |
|---|---|
| `ht_schema_version` | integer; current target = **3** |
| `ht_habits` | `{ daily[], weekly[], monthly[], quarterly[], yearly[] }` — habit/goal definitions |
| `ht_d_YYYY-MM-DD` | daily log `{ [habitId]: bool/number, remarks: {} }` |
| `ht_w_YYYY-W##` | weekly log `{ [habitId]: number, remarks: {} }` |
| `ht_m_YYYY-MM` | monthly log |
| `ht_q_YYYY-Q#` | quarterly log |
| `ht_y_YYYY` | yearly log |
| `ht_qw` | quick-wins task array |
| `ht_inbox` | brain-dump items |
| `ht_reminders` | reminder configs array |
| `ht_routine` | routine blocks |
| `ht_journal_YYYY-MM-DD` | `{ wins[], lows[], growth[] }` |
| `ht_mood_YYYY-MM-DD` | `{ score, note }` |
| `ht_cbt` | CBT/REBT thought-record array |
| `ht_areas` | area/category definitions |
| `ht_settings` | user prefs (theme, reminder defaults) |
| `ht_lastsync` | last Drive sync timestamp |

**Migration rule:** `store.js` checks `ht_schema_version` on startup. If absent or below current,
run `migrate()` — idempotent, additive only, never deletes existing keys or data.

---

## Naming conventions

- Follow existing terse style for short helpers: `dKey`, `sv`, `lsGet`, `p2`.
- Destination wrappers export just `render()` — they own the full Grove header + sub-containers.
- Sub-views (legacy) export `render()` and find their container via `document.getElementById`.
  Always include `if (!el) return;` null guard at the top.
- Grove CSS classes: `.grv-card`, `.grv-card--done`, `.grv-check.grv-check--round`, `.grv-badge`,
  `.grv-seg/.grv-seg__opt`, `.grv-progress/.grv-progress__track/.grv-progress__fill[--honey]`,
  `.grv-tabbar/.grv-tab`, `.grv-btn`, `.grv-iconbtn`
- Legacy CSS uses BEM-lite namespace prefixes (`.hc`, `.hm-*`, `.mf-*`, `.cbt-*`, `.inb-*`, etc.).
- Icons: `icon(name, {width, height, strokeWidth})` from `js/icons.js`; call `refreshIcons()`
  after injecting `<i data-lucide="...">` elements into the DOM.

---

## Design principles (every batch must follow these)

1. **Positive reinforcement first** — celebrate wins, never shame. No "failed" language.
2. **Low-friction capture** — adding anything (thought, task, drop-log) is ≤ 1 tap / click.
3. **Offline-first & private** — all data local by default; Drive sync opt-in; mental-health
   entries stay local + owner's Drive.
4. **Preserve the calm aesthetic** — use Grove design tokens and components; no heavy UI
   frameworks.
5. **Evidence-based wellbeing** — mental-health features are grounded in published methods;
   include the "self-help tool, not a substitute for professional care" disclaimer + crisis pointer.

---

## Commit & session rules *(mandatory)*

- **Commit after every batch** — conventional message e.g. `feat(inbox): B2.1 brain-dump capture`.
- **Phase-completion commit** after the last batch of each phase e.g. `chore: complete Phase 1`.
- **70 % context rule** — when context usage hits ~70 %, wrap up: finish the current in-flight
  commit, refresh `progress.md` "Resume here", commit the doc update, then end the session cleanly.
- Always update `progress.md` batch status + commit hash before stopping.

---

## Evidence base (mental health features)

| Feature | Method | Source |
|---|---|---|
| Journal Wins ("what went well & why") | *Three Good Things* — Seligman et al. 2005 RCT; raised happiness, lowered depression up to 6 months | ggia.berkeley.edu; uchealth.org |
| Thought Record | Beck CBT 7-column cognitive restructuring; typical 20–40% emotion-intensity drop after completion | psychologytools.com; blueprint.ai |
| ABC(DE) model | Ellis REBT — Activating event → Beliefs → Consequences → Disputation → Effective new belief | positivepsychology.com; universalcoachinstitute.com |
| Cognitive distortions checklist | 13 types (all-or-nothing, catastrophizing, overgeneralization, mental filter, mind-reading, labeling, emotional reasoning, …) | simplypsychology.org; healthline.com |
| Eye care | 20-20-20 rule (every 20 min, 20 ft, 20 s); preservative-free drops preferred for frequent use; preservative-containing ≤4×/day | healthline.com; aoa.org; eyecareonline.net |

---

## Roadmap summary

| Phase | Focus | Status |
|---|---|---|
| 0 | Docs & repo tidy | ✅ |
| 1 | Foundation — ES modules, schema v2, full-sync, PWA | ✅ |
| 2 | Personal needs — Inbox, Quick Wins, Eye reminder | ✅ |
| 3 | Goals hierarchy — Quarterly + Yearly + Goal linking | ✅ |
| 4 | Routine builder | ✅ |
| 5 | Motivation — Streaks, Heatmap, Stats, Areas | ✅ |
| 6 | Mental health — Journal, Mood, CBT + ABC(DE) + distortions | ✅ |
| 7 | Mindfulness — Breathing pacer + meditation timer | ✅ |
| 8 | Native mobile — Capacitor iOS/Android | ✅ |
| 9 | Grove foundation — tokens, fonts, icons, layout CSS | ✅ |
| 10 | 5-destination shell + Today view | ✅ |
| 11 | Habits destination | ✅ |
| 12 | Reflect destination | ✅ |
| 13 | Calm destination | ✅ |
| 14 | You destination | ✅ |
| 15 | Cleanup + voice pass | ✅ |
