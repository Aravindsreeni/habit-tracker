# progress.md — Habit Tracker build board

*Read this first at the start of every session. Update before stopping.*

---

## ▶ Resume here

**Current:** Phase 6 — Mental health **COMPLETE** ✅ (B6.1 Journal c0eea32 · B6.2 Mood 5b74e0b ·
B6.3 CBT Thought Record b887809 · B6.4 ABC(DE) + distortions f62b50e · phase-completion below).
**Next up: Phase 7 — Mindfulness, Batch B7.1** (breathing pacer + meditation timer →
`js/views/mindfulness.js`).

Phases 0–6 fully done. SW cache is now **`ht-v12`**. Schema still **v3** (no bump — journal/mood/
cbt keys are additive, synced automatically since `sync.js` archives all `ht_*`).

### What to do next (B7.1 — breathing + meditation; first batch of Phase 7)

New view `js/views/mindfulness.js` + `p-mindfulness` panel (follow the Phase-6 view pattern:
`init`/`render`, register in `js/views/_all.js`, nav entry in `index.html`, route in `js/app.js`).
Box-breathing and 4-7-8 pacers (animated expand/hold/contract pacer; configurable cycles) plus a
simple meditation countdown timer. Reuse `:root` tokens + existing components; keep it
offline/private. Bump SW to **`ht-v13`**. Mental-health disclaimer is NOT required here (no
journalling of distressing content) but keep the positive, low-friction tone (Design principles
1, 2, 4). Node-test any pure helpers (e.g. breathing-phase math, timer formatting).

### Phase 6 is Mental Health (evidence-based — read CLAUDE.md "Evidence base" table)

Sequence: B6.1 Journal ✅ → B6.2 Mood ✅ → B6.3 Thought Record ✅ → **B6.4 ABC(DE) +
distortions**. **Every mental-health batch MUST include** the "self-help tool, not a substitute
for professional care" disclaimer + a crisis-resource pointer, and keep entries local/private
(Design principle 3 + 5 in CLAUDE.md). Positive, non-judgemental tone throughout.

### What to do next (B6.4 — ABC(DE) model + cognitive-distortions checklist)

**Extends the existing `js/views/cbt.js` and the `ht_cbt` array** — do NOT make a new tab/store.
Two additions (see CLAUDE.md evidence table — Ellis REBT + the 13 distortions):

1. **13-item cognitive-distortions checklist** in the thought-record form. The `distortions[]`
   field is already reserved + node-tested in `normalizeCbt` (filters to string array). Add a
   `DISTORTIONS` const (id + label + 1-line example) and render as tappable chips/checkboxes in
   the form (multi-select); save the selected ids onto `entry.distortions`. Show them as small
   tags in the expanded card. 13 types per CLAUDE.md: all-or-nothing, catastrophizing,
   overgeneralization, mental filter, mind-reading, labeling, emotional reasoning,
   discounting-the-positive, fortune-telling, personalization, should-statements,
   magnification/minimization, blaming. (Confirm the exact 13 against simplypsychology.org /
   healthline.com — the CLAUDE.md row lists representative ones with "…".)

2. **ABC(DE) model** as a second record framing (Ellis REBT): Activating event → Beliefs →
   Consequences → Disputation → Effective new belief. Recommended approach: add an `entry.model`
   discriminator (`'beck'` default for existing records | `'abcde'`) and a small mode toggle at
   the top of the New-record form. Reuse the same storage fields where they map cleanly
   (situation≈A, thoughts≈B, emotion≈C, balanced≈E) OR add abcde-specific keys to `normalizeCbt`
   and branch the form/card by `model`. Keep both in the one `ht_cbt` array; default un-tagged
   entries to `'beck'` so old records still render.

Wiring for B6.4: `sw.js` bump to **`ht-v12`** (only if files change — cbt.js will); update the
`.cbt-*` CSS for chips/toggle; extend the `normalizeCbt` node tests (distortions already
covered — add model + any new fields). No app.js/index.html/_all.js changes needed (cbt.js
already registered). **Phase-completion commit** after B6.4: `chore: complete Phase 6 — Mental health`.

### Reuse notes (Phase 6 so far)
- Pure node-tested exports: `journal.js`→`normalize`; `mood.js`→`normalizeMood`/`avgScore`/
  `lastNDates(todayYmd,n)` (DST+leap safe); `cbt.js`→`normalizeCbt`/`intensityDelta`/`hasContent`.
- **Disclaimer pattern:** every MH view has a local `disclaimerHTML()` returning the shared
  `.jr-disc` box with **Tele-MANAS 14416** + "local emergency number". Reuse verbatim.
- `cbt.js` view state: module-level `formOpen` + `openId`; form built in `_renderForm()`,
  list in `_renderList()`; `TEXTCOLS` drives the textarea fields; `_card()`/`cardBody()` render
  expanded entries. Add the distortions UI inside `_renderForm` and a tags row in `cardBody`.
- `store.js`: `CBT` state + `setCBT`/`svCBT` (array, mirrors INBOX). Per-date helpers exist for
  journal/mood (`jKey`/`moodKey` families) but CBT is an array.

**Verification done (B6.1–B6.3):** node-tested — B6.1 `normalize` 9/9 · B6.2 trend logic 16/16
(DST+leap) · B6.3 `normalizeCbt`/`intensityDelta`/`hasContent` 21/21. `node --check` clean on
all changed modules; served over http — all modules 200 each batch ✅.

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
| B6.3 CBT Thought Record | ✅ done | b887809 | `js/views/cbt.js`, `js/store.js`, `js/app.js`, `js/views/_all.js`, `index.html`, `sw.js`, `css/base.css` | Beck 7-column worksheet; `ht_cbt` array; newest-first tap-to-expand; before→after intensity delta badge + footnote; `CBT`/`setCBT`/`svCBT`; pure normalizeCbt/intensityDelta/hasContent node-tested 21/21; `distortions[]` reserved for B6.4; ht-v11 |
| B6.4 ABC(DE) + distortions | ✅ done | f62b50e | `js/views/cbt.js`, `css/base.css`, `sw.js` | Ellis REBT ABC(DE) as a 2nd framing via `entry.model` ('beck' default \| 'abcde') + form mode toggle (A=situation, B=thoughts, C=emotion+%, D=new `disputation`, E=balanced); legacy records default 'beck'. 13-item distortions checklist as multi-select chips → `entry.distortions[]` (normalizeCbt filters to known ids, de-dups, canonical order), shown as tags in card. Draft preserved across toggle. Disclaimer covers CBT+REBT. normalizeCbt/intensityDelta/hasContent node-tested 25/25; ht-v12 |
| Phase 6 complete | ✅ done | 990cc55 | — | Mental health done (journal + mood + CBT thought record + ABC(DE) + distortions) |
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
