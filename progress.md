# progress.md — Habit Tracker build board

*Read this first at the start of every session. Update before stopping.*

---

## ▶ Resume here

**Current:** Phase 2 complete → start **Phase 3, Batch B3.1**

### What to do next (B3.1 — Quarterly + Yearly goal views)

Add Quarterly and Yearly tabs, reusing the weekly/monthly counter-to-target pattern.

Key files to create/modify:
- **`js/store.js`** — add `qKey()`, `yKey()`, `qName()`, `yName()` date helpers;
  `Q` and `Y` state vars; `setQ/setY`; `svQ/svY`; `loadAll()` reads `ht_q_*` + `ht_y_*`
  Also add `quarterly: []` + `yearly: []` to `DEFAULT_HABITS` and in migration ensure they exist.
- **`js/views/quarterly.js`** — new view (copy weekly pattern; counter-to-target + summary)
- **`js/views/yearly.js`**    — new view (same)
- **`js/views/_all.js`**      — add quarterly + yearly render to `renderAll()`
- **`js/app.js`**             — register 'quarterly' + 'yearly' views
- **`index.html`**            — add Quarterly + Yearly tabs + panels + add-habit forms
- **`sw.js`**                 — ht-v4 cache; add quarterly.js + yearly.js

Storage keys:
- `ht_q_YYYY-Q#` → `{ [habitId]: number, remarks: {} }`
- `ht_y_YYYY`    → `{ [habitId]: number, remarks: {} }`

Quarter key formula (similar to ISO week key):
```js
function qKey() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `ht_q_${d.getFullYear()}-Q${q}`;
}
```

**Verification for B3.1:**
1. `python -m http.server 8000` → Quarterly + Yearly tabs show
2. Add a quarterly habit (e.g. "Read 3 books"), counter increments/decrements
3. Add a yearly habit, summary bar updates
4. Daily/Weekly/Monthly still work identically
5. Existing localStorage data is preserved

---

## Batch board

| Batch | Status | Commit | Files changed | Notes |
|---|---|---|---|---|
| B0.1 Docs + flatten | ✅ done | fb59c40 | `CLAUDE.md`, `progress.md`, `index.html`→root, `app.js`→root, `style.css`→root | Nested `habit-tracker/habit-tracker/` removed; Pages now serves from repo root |
| B1.1 ES module split | ✅ done | f508173 | `index.html`, `css/tokens.css`, `css/base.css`, `js/app.js`, `js/store.js`, `js/ui.js`, `js/sync.js`, `js/router.js`, `js/views/*` | Monolithic app.js → 11 ES modules; behavior-identical |
| B1.2 Schema v2 + migration | ✅ done | 222b808 | `js/store.js`, `js/app.js` | initSchema() + migrate() before loadAll() |
| B1.3 Full-history sync + Export/Import | ✅ done | 7e9d887 | `js/sync.js`, `js/app.js`, `index.html` | buildPayload collects all ht_* keys; Export/Import JSON buttons |
| B1.4 PWA + Settings + scalable nav | ✅ done | 53bf1c2 | `manifest.webmanifest`, `sw.js`, `icons/icon-192.svg`, `css/tokens.css`, `js/views/settings.js`, `js/app.js`, `index.html` | Offline app-shell, installable, theme toggle |
| B2.1 Brain-dump / Inbox | ✅ done | a102690 | `js/views/inbox.js`, `js/store.js`, `js/app.js`, `js/views/_all.js`, `index.html`, `css/base.css`, `sw.js` | Inbox tab with capture, note, done, convert-to-task |
| B2.2 Smart Quick Wins | ✅ done | 1091126 | `js/views/tasks.js`, `index.html`, `css/base.css` | Priority field + win-score sort |
| B2.3 Eye-care Reminder | ✅ done | 4159999 | `js/reminders.js`, `js/views/settings.js`, `js/app.js`, `css/base.css`, `sw.js` | Configurable timer, Notification API, in-app banner, daily count |
| B3.1 Quarterly + Yearly | 🔲 todo | — | `js/views/quarterly.js`, `js/views/yearly.js`, `js/store.js` | Reuse weekly/monthly pattern |
| B3.2 Goal linking | 🔲 todo | — | TBD | Deferrable |
| B4.1 Routine builder | 🔲 todo | — | `js/views/routine.js` | Time-blocked day |
| B5.1 Streaks | 🔲 todo | — | `js/views/stats.js` | Needs full-history sync (B1.3) first |
| B5.2 Heatmap | 🔲 todo | — | `js/views/stats.js` | Year-calendar per habit |
| B5.3 Statistics + Areas | 🔲 todo | — | `js/views/stats.js`, `js/store.js` | Completion rates + categories |
| B6.1 Daily Journal | 🔲 todo | — | `js/views/journal.js` | 10:1:2 limits; history view |
| B6.2 Mood check-in | 🔲 todo | — | `js/views/mood.js` | Scale + note; disclaimer |
| B6.3 CBT Thought Record | 🔲 todo | — | `js/views/cbt.js` | 7-column Beck worksheet |
| B6.4 ABC(DE) + distortions | 🔲 todo | — | `js/views/cbt.js` | Ellis model + 13-item checklist |
| B7.1 Breathing + meditation | 🔲 todo | — | `js/views/mindfulness.js` | Box/4-7-8 pacer |
| B8.1 Capacitor native | 🔲 todo | — | New Capacitor project | iOS/Android wrap |

---

## Key decisions log

| Date | Decision |
|---|---|
| 2026-06-05 | Architecture: vanilla ES modules + PWA, no build step |
| 2026-06-05 | Sequencing: foundation-first, then personal-needs → goals → motivation → mental-health |
| 2026-06-05 | Primary device: desktop while working; reminders = Notification API (foreground-reliable) |
| 2026-06-05 | Flatten nested `habit-tracker/habit-tracker/` → repo root (B0.1) |
| 2026-06-05 | Commit after every batch + phase; 70% context rule to hand off sessions cleanly |
