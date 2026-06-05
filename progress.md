# progress.md — Habit Tracker build board

*Read this first at the start of every session. Update before stopping.*

---

## ▶ Resume here

**Current:** Phase 3 complete (B3.1 c7496d1, B3.2 767dd58) → start **Phase 4, Batch B4.1 — Routine builder**

### What to do next (B4.1 — Time-blocked routine)

A day-view of time blocks the user can add/edit/reorder, stored in `ht_routine`.

Key files to create/modify:
- **`js/views/routine.js`** — new view: list of time blocks `{ id, start, end, label, done? }`
  sorted by start time; add/edit/delete; tap to mark done (positive reinforcement, no shame).
  Export `init`/`render` + `showAddForm`/`closeAddForm`/`addBlock` following the existing
  view conventions (see `weekly.js`/`quarterly.js` for the add-form + `window.*` global pattern).
- **`js/store.js`** — `ROUTINE` state + `setRoutine`; `loadAll()` reads `ht_routine` (default `[]`);
  `svRoutine()` (mirror `svInbox`); storage key already reserved in CLAUDE.md (`ht_routine`).
- **`js/views/_all.js`** — add routine render to `renderAll()` (for sync restore).
- **`js/app.js`** — register `'routine'` view; wire add-form/keyboard handlers.
- **`index.html`** — Routine tab + panel + add-block form (time inputs + label).
- **`sw.js`** — bump to `ht-v5`; add `js/views/routine.js` to the shell.

Design notes:
- Keep capture ≤ 1 action; default new-block start to "now" rounded, end +30 min.
- Consider an optional `link` to a habit (reuse B3.2 `linkSources`) so a routine block can
  tick a daily habit — but that's a stretch goal; ship the plain time-block list first.

**Verification for B4.1:**
1. `python -m http.server 8000` → Routine tab shows.
2. Add a couple of time blocks; they sort by start time; mark done toggles state.
3. Reload → blocks persist (localStorage). Export/Import + Drive sync include `ht_routine`.
4. All prior tabs (Daily…Yearly, Quick Wins, Inbox) still work; existing data preserved.

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
| B3.1 Quarterly + Yearly | ✅ done | c7496d1 | `js/views/quarterly.js`, `js/views/yearly.js`, `js/store.js`, `js/views/notes.js`, `js/views/_all.js`, `js/app.js`, `index.html`, `sw.js` | Quarterly + Yearly tabs; counter-to-target reusing weekly/monthly pattern; ht-v4 cache |
| B3.2 Goal linking | ✅ done | 767dd58 | `js/store.js`, `js/views/quarterly.js`, `js/views/yearly.js`, `index.html`, `css/base.css` | Quarterly/yearly goals optionally link to a lower-period habit; progress rolled up (read-only) over the current quarter/year |
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
