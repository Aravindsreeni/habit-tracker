# CLAUDE.md — Habit Tracker / Routine & Wellbeing OS

*Auto-loaded context for every Claude Code session on this repo.*
*Source of truth: the approved plan at `C:\Users\91949\.claude\plans\this-is-my-habit-synchronous-bachman.md`*
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

## Module map (target; built incrementally by phase)

```
index.html          ← links manifest, SW; <script type="module" src="js/app.js">
manifest.webmanifest
sw.js               ← app-shell cache (Phase 1.4)
icons/              ← 192/512 maskable PWA icons (Phase 1.4)
css/
  tokens.css        ← :root design tokens (from original style.css lines 1-43)
  base.css          ← layout, nav, cards, forms, toast, utility
  features/         ← per-feature overrides (only if base.css grows > ~800 lines)
js/
  app.js            ← bootstrap: init store → register views → render active tab
  store.js          ← state, localStorage, schema v2, migration
  sync.js           ← Google Drive OAuth + full-history payload + Export/Import JSON
  ui.js             ← toast(), mkCard(), mkSum(), modal(), icons, char-counter
  router.js         ← view registry, nav activation, overflow "More" menu
  reminders.js      ← recurring timer engine + Notification API (Phase 2.3)
  views/
    daily.js weekly.js monthly.js quarterly.js yearly.js
    tasks.js inbox.js routine.js
    stats.js settings.js
    journal.js cbt.js mood.js mindfulness.js
```

*During Phase 0–1 the monolithic `app.js` is progressively split into this structure.*
*Each phase only adds the modules it needs.*

---

## Storage keys (localStorage)

| Key pattern | Content |
|---|---|
| `ht_schema_version` | integer; current target = **2** |
| `ht_habits` | `{ daily[], weekly[], monthly[] }` — habit definitions |
| `ht_d_YYYY-MM-DD` | daily log `{ [habitId]: bool/number, remarks: {} }` |
| `ht_w_YYYY-W##` | weekly log `{ [habitId]: number, remarks: {} }` |
| `ht_m_YYYY-MM` | monthly log `{ [habitId]: number, remarks: {} }` |
| `ht_q_YYYY-Q#` | quarterly log (Phase 3) |
| `ht_y_YYYY` | yearly log (Phase 3) |
| `ht_qw` | quick-wins task array |
| `ht_inbox` | brain-dump items (Phase 2.1) |
| `ht_reminders` | reminder configs array (Phase 2.3) |
| `ht_routine` | routine blocks (Phase 4) |
| `ht_journal_YYYY-MM-DD` | `{ wins, lows, growth }` (Phase 6.1) |
| `ht_mood_YYYY-MM-DD` | `{ score, note }` (Phase 6.2) |
| `ht_cbt` | CBT log entries array (Phase 6.3–6.4) |
| `ht_areas` | area/category definitions (Phase 5.3) |
| `ht_settings` | user prefs (theme, reminder defaults, etc.) |
| `ht_lastsync` | last Drive sync timestamp string |

**Migration rule:** `store.js` checks `ht_schema_version` on startup. If absent or below current,
run `migrate()` — idempotent, additive only, never deletes existing keys or data.

---

## Naming conventions

- Follow existing terse style for short helpers: `dKey`, `rD`, `sv`, `lsGet`.
- New view modules export: `init(container)` (build static DOM once) + `render()` (refresh from store).
- Keep functions small (< 40 lines); split logic from rendering.
- CSS classes: existing BEM-lite (`hc`, `hr`, `hn`, `ra`); new sections may use a namespace prefix, e.g. `.inb-*` for inbox.

---

## Design principles (every batch must follow these)

1. **Positive reinforcement first** — celebrate wins, never shame. No "failed" language.
2. **Low-friction capture** — adding anything (thought, task, drop-log) is ≤ 1 tap / click.
3. **Offline-first & private** — all data local by default; Drive sync opt-in; mental-health entries stay local + owner's Drive.
4. **Preserve the minimal aesthetic** — reuse `:root` tokens and existing components; no heavy UI frameworks.
5. **Evidence-based wellbeing** — mental-health features are grounded in published methods; include the
   "self-help tool, not a substitute for professional care" disclaimer and a crisis-resource pointer.

---

## Commit & session rules *(mandatory)*

- **Commit after every batch** — conventional message e.g. `feat(inbox): B2.1 brain-dump capture`.
- **Phase-completion commit** after the last batch of each phase e.g. `chore: complete Phase 1 — Foundation`.
- **70 % context rule** — when context usage hits ~70 %, wrap up: finish the current in-flight commit,
  refresh `progress.md` "Resume here", commit the doc update, then end the session cleanly.
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

## Roadmap summary (full detail in plan file)

| Phase | Focus | Key batches |
|---|---|---|
| 0 | Docs & repo tidy | B0.1 ✅ |
| 1 | Foundation — ES modules, schema v2, full-sync, PWA | B1.1 – B1.4 |
| 2 | Personal needs | B2.1 Brain-dump, B2.2 Smart wins, B2.3 Eye reminder |
| 3 | Goals hierarchy | B3.1 Quarterly + Yearly, B3.2 Goal linking |
| 4 | Routine builder | B4.1 Time-blocked routine |
| 5 | Motivation: streaks, heatmap, stats, areas | B5.1 – B5.3 |
| 6 | Mental health: journal, mood, CBT | B6.1 – B6.4 |
| 7 | Mindfulness | B7.1 Breathing pacer + meditation timer |
| 8 | Native mobile | B8.1 Capacitor iOS/Android |
