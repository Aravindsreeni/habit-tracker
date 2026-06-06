# progress.md — Habit Tracker build board

*Read this first at the start of every session. Update before stopping.*

---

## ▶ Resume here

**Current:** Phase 6 — Mental health. **B6.1 Journal** (c0eea32) + **B6.2 Mood** (5b74e0b)
done → next is Batch **B6.3 — CBT Thought Record**.

Phase 5 (Motivation) fully done. B6.1 Journal + B6.2 Mood now ship. SW cache is now **`ht-v10`**.
Schema still **v3** (no bump — journal/mood keys are additive, synced automatically since
`sync.js` archives all `ht_*`).

### Phase 6 is Mental Health (evidence-based — read CLAUDE.md "Evidence base" table)

Sequence: B6.1 Journal ✅ → B6.2 Mood ✅ → **B6.3 CBT Thought Record** → B6.4 ABC(DE) +
distortions. **Every mental-health batch MUST include** the "self-help tool, not a substitute
for professional care" disclaimer + a crisis-resource pointer, and keep entries local/private
(Design principle 3 + 5 in CLAUDE.md). Positive, non-judgemental tone throughout.

### What to do next (B6.3 — CBT Thought Record)

Beck's **7-column** cognitive-restructuring worksheet (see CLAUDE.md evidence table — typical
20–40% emotion-intensity drop after completion). Columns: **Situation → Automatic thought(s)
→ Emotion(s) + intensity % → Evidence for → Evidence against → Balanced/alternative thought →
Re-rate emotion %**. Storage key **`ht_cbt`** = an **array** of entries (NOT per-date — per
CLAUDE.md storage table `ht_cbt` is the "CBT log entries array" shared by B6.3 + B6.4). New
`js/views/cbt.js` + `cbt` tab/panel.

Plan:
- **`js/views/cbt.js`** — NEW view. A "+ New thought record" form that walks the 7 columns
  (a multi-field form, not one-tap — this is reflective). Saved entries listed newest-first,
  tap-to-expand (reuse the journal history pattern). Show the intensity before→after delta as
  positive reinforcement ("emotion eased 70%→30%"). Add an `id` + `createdAt` per entry.
- **`js/store.js`** — `CBT` mutable state + `setCBT`/`svCBT` (array in `ht_cbt`, mirror
  INBOX/`svInbox`). Load `CBT = lsGet('ht_cbt') || []` in `loadAll()`.
- **`index.html`** — CBT tab + `p-cbt` panel (place after Mood, before Settings).
- **`js/app.js`** — import + `registerView('cbt', 'p-cbt', rCbt)`.
- **`js/views/_all.js`** — add `rCbt()` to `renderAll()`.
- **`sw.js`** — bump to **`ht-v11`**; add `js/views/cbt.js` to SHELL.
- **`css/base.css`** — new `.cbt-*` namespace.
- **Pure logic to node-test:** an entry `normalize`/validation + the before→after intensity
  delta calc. NOTE B6.4 will extend this same `cbt.js`/`ht_cbt` with ABC(DE) + a 13-item
  cognitive-distortions checklist — leave room (e.g. an optional `distortions[]` field).

### Reuse notes (B6.1 / B6.2)
- Pure exports: `journal.js` → `normalize(raw)`; `mood.js` → `normalizeMood`, `avgScore`,
  `lastNDates(todayYmd, n)` (DST/leap-safe — reusable for any windowed trend). All node-tested.
- Disclaimer: copy `disclaimerHTML()` + the `.jr-disc` styling (mood reuses the `jr-disc`
  class). Keep Tele-MANAS 14416 + "local emergency number" wording.
- `store.js` per-date helpers: `jKey`/`eachJournal`/`svJournal`, `moodKey`/`eachMood`/`svMood`.
  (B6.3 `ht_cbt` is an array, so mirror INBOX/`svInbox` instead.)

**Verification done:** B6.1 `normalize()` 9/9, B6.2 `normalizeMood`/`avgScore`/`lastNDates`
16/16 (incl. DST + leap year) — all node-tested ✅. `node --check` clean; served over http,
all modules 200 ✅.

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
| Phase 5 complete | ✅ done | 28dab9b | — | Motivation phase done (streaks + heatmap + stats + areas) |
| B6.1 Daily Journal | ✅ done | c0eea32 | `js/views/journal.js`, `js/store.js`, `js/app.js`, `js/views/_all.js`, `index.html`, `sw.js`, `css/base.css` | 🌟/🌧️/🌱 sections, 10:1:2 caps; ht_journal_YYYY-MM-DD `{wins[],lows[],growth[]}`; tap-to-expand history; disclaimer + Tele-MANAS; pure `normalize()` node-tested; ht-v9 |
| B6.2 Mood check-in | ✅ done | 5b74e0b | `js/views/mood.js`, `js/store.js`, `js/app.js`, `js/views/_all.js`, `index.html`, `sw.js`, `css/base.css` | One-tap 5-pt scale 😞–😄 + note; ht_mood_YYYY-MM-DD `{score,note}`; 14-day trend bars + avg; non-judgemental caption; `moodKey`/`eachMood`/`svMood`; pure normalizeMood/avgScore/lastNDates node-tested 16/16; ht-v10 |
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
