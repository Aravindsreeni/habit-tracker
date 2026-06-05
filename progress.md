# progress.md — Habit Tracker build board

*Read this first at the start of every session. Update before stopping.*

---

## ▶ Resume here

**Current:** Phase 4 complete (B4.1 28b7d8f) → start **Phase 5, Batch B5.1 — Streaks**

Phase 5 is Motivation: streaks → heatmap → statistics + areas. It needs the full habit
history that full-history sync (B1.3) already keeps in localStorage as `ht_d_*` / `ht_w_*` /
`ht_m_*` / `ht_q_*` / `ht_y_*` keys.

### What to do next (B5.1 — Streaks)

Compute and surface current + longest streaks per daily habit (and ideally weekly/monthly),
to reward consistency.

Key files to create/modify:
- **`js/views/stats.js`** — NEW view (first batch of Phase 5). Register a `'stats'` tab.
  - Read every `ht_d_YYYY-MM-DD` key from localStorage; for each daily habit id, build the
    set of dates it was completed (checkbox `=== true`, or counter `> 0`).
  - `currentStreak(habit)` = consecutive days up to today; `longestStreak(habit)` = max run.
  - Render a card per daily habit: 🔥 current streak + best streak. Celebrate, never shame
    (e.g. "Best yet!" when current === longest and > 0).
  - There may be a helper worth adding to `store.js`: `allKeys(prefix)` to enumerate logs,
    and `dKeyFor(date)` (parameterized version of `dKey()`) for walking days backwards.
- **`js/store.js`** — add `dKeyFor(date)` (or reuse a small date-format helper); optional
  `eachDailyLog(cb)` iterator. Keep helpers small.
- **`js/views/_all.js`** — add stats render to `renderAll()`.
- **`js/app.js`** — register `'stats'` view + import.
- **`index.html`** — Stats tab + `p-stats` panel (self-rendering like inbox/routine).
- **`sw.js`** — bump to `ht-v6`; add `js/views/stats.js` to the shell.

Note: B5.2 (heatmap) and B5.3 (statistics + areas) build on the same `stats.js` view,
so structure it to grow (separate compute helpers from render).

**Verification for B5.1:**
1. `python -m http.server 8000` → Stats tab shows a streak card per daily habit.
2. Manually seed a few `ht_d_*` keys (or log several days) → current/longest streak update.
3. A gap in days resets the current streak but preserves the longest.
4. All prior tabs still work; existing data preserved.

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
| B4.1 Routine builder | ✅ done | 28b7d8f | `js/views/routine.js`, `js/store.js`, `js/views/_all.js`, `js/app.js`, `index.html`, `css/base.css`, `sw.js` | Routine tab: add/tick/delete time blocks, sorted by start; ht-v5 cache |
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
