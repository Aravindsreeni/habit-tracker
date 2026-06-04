# progress.md — Habit Tracker build board

*Read this first at the start of every session. Update before stopping.*

---

## ▶ Resume here

**Current:** Phase 0 complete → start **Phase 1, Batch B1.1**

### What to do next (B1.1)

Split the monolithic `app.js` + `style.css` into ES modules while keeping all four tabs
(Daily / Weekly / Monthly / Quick Wins) **behavior-identical**. Target structure:

```
index.html        ← <script type="module" src="js/app.js">
css/
  tokens.css      ← :root variables (lines 1–43 of original style.css)
  base.css        ← everything else from style.css
js/
  app.js          ← bootstrap only (init + render calls)
  store.js        ← lsGet, lsSet, state vars (HABITS/D/W/M/QW), loadAll, sv, date keys
  sync.js         ← Google Drive code (gisLoaded, requestToken, driveFind/Save/Load, buildPayload, doSync, doLoadDrive, scheduleSync)
  ui.js           ← ckSVG/penSVG/xSVG, mkCard, mkSum, toast
  router.js       ← sw() tab switch
  views/
    daily.js      ← rD, tC, aW, sW, showAddForm, closeAddForm, toggleMaxField, addHabit('daily'), delHabit
    weekly.js     ← rW, aWk, addHabit('weekly')
    monthly.js    ← rM, aMo, addHabit('monthly')
    tasks.js      ← rQ, tf, da, tQ, dQ, sf (Quick Wins)
    notes.js      ← tr, sR (shared note toggle — used by daily/weekly/monthly)
```

**Verification for B1.1:**
1. `python -m http.server 8000` → open http://localhost:8000/
2. All four tabs load, add/delete/check habits work, notes open/save, Quick Wins add/complete/delete
3. Google Drive sync button still present (even if not tested)
4. No JS console errors

---

## Batch board

| Batch | Status | Commit | Files changed | Notes |
|---|---|---|---|---|
| B0.1 Docs + flatten | ✅ done | *(fill after commit)* | `CLAUDE.md`, `progress.md`, `index.html`→root, `app.js`→root, `style.css`→root | Nested `habit-tracker/habit-tracker/` removed; Pages now serves from repo root |
| B1.1 ES module split | 🔲 todo | — | `index.html`, `css/*`, `js/*` | Behavior-identical refactor |
| B1.2 Schema v2 + migration | 🔲 todo | — | `js/store.js` | Preserve all existing localStorage data |
| B1.3 Full-history sync + Export/Import | 🔲 todo | — | `js/sync.js`, `index.html` | Fix buildPayload to include all ht_* keys |
| B1.4 PWA + Settings + scalable nav | 🔲 todo | — | `manifest.webmanifest`, `sw.js`, `icons/`, `js/router.js`, `js/views/settings.js` | Offline shell, installable, overflow nav |
| B2.1 Brain-dump / Inbox | 🔲 todo | — | `js/views/inbox.js`, CSS | Ultra-low-friction capture |
| B2.2 Smart Quick Wins | 🔲 todo | — | `js/views/tasks.js`, `js/store.js` | Add priority; smart sort |
| B2.3 Eye-care Reminder | 🔲 todo | — | `js/reminders.js`, `js/views/settings.js` | Timer + Notification API |
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
