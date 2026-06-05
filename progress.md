# progress.md — Habit Tracker build board

*Read this first at the start of every session. Update before stopping.*

---

## ▶ Resume here

**Current:** Phase 5 complete (B5.1 220e096 · B5.2 5023bbd · B5.3 d90fadd) → start
**Phase 6 — Mental health**, Batch **B6.1 — Daily Journal**.

Phase 5 (Motivation) is fully done: the Stats tab now shows Streaks → Consistency (30/90-day
completion rates) → Areas (categories + grouped rate) → year Heatmap, all in `js/views/stats.js`.
Schema is now **v3** (`ht_areas`). SW cache is `ht-v8`.

### Phase 6 is Mental Health (evidence-based — read CLAUDE.md "Evidence base" table)

Sequence: B6.1 Daily Journal → B6.2 Mood check-in → B6.3 CBT Thought Record → B6.4 ABC(DE)
+ distortions. **Every mental-health batch MUST include** the "self-help tool, not a substitute
for professional care" disclaimer + a crisis-resource pointer, and keep entries local/private
(Design principle 3 + 5 in CLAUDE.md). Positive, non-judgemental tone throughout.

### What to do next (B6.1 — Daily Journal)

Three Good Things / "what went well & why" (Seligman 2005 — see evidence table). Storage key
`ht_journal_YYYY-MM-DD` → `{ wins, lows, growth }` (per CLAUDE.md storage table).

Plan:
- **`js/views/journal.js`** — NEW self-rendering view (mirror inbox/routine/stats pattern:
  `render()` reads store, paints into a `p-journal` panel). Today's entry editable; a short
  history list of past days below (read-only or tap-to-expand). The plan notes "10:1:2 limits"
  — cap wins at ~10, lows ~1, growth ~2 entries (gentle, encourages focusing on the positive).
- **`js/store.js`** — journal is per-date like the daily logs; add a small helper if useful
  (e.g. `jKey(date)` → `ht_journal_YYYY-MM-DD`) and load today's entry in `loadAll()` OR keep
  it lazy in the view. Mirror `svRoutine`/`svAreas` for save (`svJournal`). No schema bump
  needed unless you add migration (journal keys are additive; probably skip).
- **`index.html`** — Journal tab + `p-journal` panel (self-rendering, empty div).
- **`js/app.js`** — import + `registerView('journal', 'p-journal', rJournal)`.
- **`js/views/_all.js`** — add `rJournal()` to `renderAll()`.
- **`sw.js`** — bump to `ht-v9`; add `js/views/journal.js` to the shell SHELL array.
- **`css/base.css`** — new `.jr-*` namespace.

**Verification for B6.1:**
1. `python -m http.server 8000` → Journal tab; write wins/lows/growth → persists on reload.
2. History shows prior days. Disclaimer + crisis line visible. All prior tabs still work.
3. `node --check` changed modules first.

### Stats.js helpers available to reuse later (e.g. B6.2 mood trends)
- compute (all exported, node-tested): `completedDaySets`, `currentStreak`, `longestStreak`,
  `heatmapWeeks`, `completionRate(daySet, windowDays)`, `areaRate(areaId, habits, sets, win)`.
- module-local: `isDone`, `todayNum`, `numToYmd`, `dayNum`, `esc`. Render is split into
  per-section fns (`renderStreaks/renderStats/renderAreas/renderHeatmaps`) below the
  `── Render ──` divider. `store.js`: `dKeyFor`, `eachDailyLog`, `AREAS`/`setAreas`/`svAreas`.

### Verification log (Phase 5)
- B5.1 streak math, B5.2 `heatmapWeeks` geometry, B5.3 `completionRate`/`areaRate` — all
  unit-tested in node (windowed counts, out-of-window exclusion, empty/edge cases, area
  aggregation 40/60=67%) and passed. Each batch also served over http (200s, correct cache).

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
| B5.2 Heatmap | ✅ done | 5023bbd | `js/views/stats.js`, `css/base.css`, `sw.js` | GitHub-style year calendar per daily habit; heatmapWeeks() reuses B5.1 compute; ht-v7 cache |
| B5.3 Statistics + Areas | ✅ done | d90fadd | `js/views/stats.js`, `js/store.js`, `css/base.css`, `sw.js` | 30/90-day completion rates; ht_areas categories (schema v3); per-habit area tagging + grouped rate; ht-v8 |
| Phase 5 complete | ✅ done | _pending_ | — | Motivation phase done (streaks + heatmap + stats + areas) |
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
