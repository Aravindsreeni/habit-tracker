# progress.md — Habit Tracker build board

*Read this first at the start of every session. Update before stopping.*

---

## ▶ Resume here

**Current:** B5.1 Streaks complete (220e096) → start **Phase 5, Batch B5.2 — Heatmap**

Phase 5 is Motivation: streaks ✅ → heatmap → statistics + areas. All of it reads the full
daily history kept in localStorage as `ht_d_*` keys (and weekly/monthly for later).

### B5.1 recap (so the next batch can lean on it)

`js/views/stats.js` already exists and the `'stats'` tab is registered. It exports reusable,
**already-tested** compute helpers that B5.2 should reuse instead of re-reading storage:
- `completedDaySets(habits)` → `{ habitId: Set<dayNum> }` in one pass over `eachDailyLog`.
  `dayNum` = `Math.floor(Date.UTC(y,m-1,d)/86400000)` (DST-safe whole-day integer).
- `currentStreak(daySet)` / `longestStreak(daySet)`.
- `store.js` gained `dKeyFor(date)` and `eachDailyLog(cb)` (cb gets `'YYYY-MM-DD'`, logObj).
- `isDone(habit, value)` (module-local): counter (`type==='w'`) done if `> 0`, else checkbox `=== true`.
- Render is split from compute (the render section starts at the `── Render ──` divider).
  CSS lives under `/* ── Stats / streaks ── */` in base.css (`.st-card/.st-fire/.st-foot/...`).

### What to do next (B5.2 — Heatmap)

A year-calendar (GitHub-style) of completion per daily habit, to make consistency visible.

Suggested approach:
- Add a render-only section to `stats.js` (do NOT duplicate compute — reuse `completedDaySets`).
  Consider a small `daySetFor(habit)` or just call `completedDaySets` once and pass the Set in.
- For each daily habit, render ~52 weeks × 7 days of cells (today back one year). Each cell is
  on/off (or intensity if a counter). Use the existing `dayNum` math to test `daySet.has(n)`.
  Map columns = weeks, rows = weekday; align so the last column ends at today.
- New CSS namespace (e.g. `.hm-*`) — keep cells tiny (≈11px) and use `--ok` tones for "done".
  Tooltip per cell = the date (+ value). Mind dark/light tokens.
- Keep it lean (no build step). A wrapper that scrolls horizontally on narrow screens is fine.
- `sw.js`: bump to `ht-v7` only if you add a new file (stats.js is already cached) — otherwise
  no shell change needed since stats.js is already listed.

**Verification for B5.2:**
1. `python -m http.server 8000` → Stats tab shows a year heatmap per daily habit beneath/above
   the streak cards.
2. Seed/scatter several `ht_d_*` days → corresponding cells light up on the right dates.
3. Hover a cell → shows its date. Streak cards from B5.1 still render; all prior tabs work.

### B5.1 verification (done)
- Algorithm unit-tested in node: consecutive run, today-blank tolerance, gap resets current but
  preserves longest, empty = 0 — all passed.
- Served over http: Stats tab + `p-stats` panel present, `stats.js` 200, sw cache `ht-v6`.

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
| B5.1 Streaks | ✅ done | 220e096 | `js/views/stats.js`, `js/store.js`, `js/views/_all.js`, `js/app.js`, `index.html`, `css/base.css`, `sw.js` | Stats tab; current+longest streak per daily habit; DST-safe day math; compute helpers split from render; ht-v6 cache |
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
