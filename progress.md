# progress.md — Habit Tracker build board

*Read this first at the start of every session. Update before stopping.*

---

## ▶ Resume here

**Localisation i18n (Phases 16–19) COMPLETE ✅** — commits `879d7a5` + `83f194b`.

English + Malayalam localisation is fully wired:
- **Phase 16** (`js/i18n.js`, `js/locales/en.js`): `t()` engine, ~300 English keys, `initLang()`, `getLang()`, `plural()`
- **Phase 17** (`js/locales/ml.js`): complete Malayalam translations for all ~300 keys
- **Phase 18** (all 12 view files): `t()` wired into today, habits, reflect, calm, you, mood, journal, cbt, mindfulness, settings, inbox, stats
- **Phase 19** (`sw.js`): cache bumped to `ht-v24`; `i18n.js` + both locale files added to SHELL

Language selector (English / മലയാളം) lives in **You → Settings** below the Theme picker.
Language persists via `ht_settings.lang`; switching triggers `renderAll()` + `resetBuilt()`.

SW cache: **`ht-v24`**. Schema: **v3** (unchanged).

### Architecture (post-i18n)

- `app.js` calls `await initLang()` before `initSchema()` so views always see a loaded locale
- `js/i18n.js` — `t(key, vars)`, `initLang(lang)`, `getLang()`, `plural(n, one, other)`
- `js/locales/en.js` + `js/locales/ml.js` — flat namespace objects with dot-key entries
- All 12 view files import `{ t }` from `../i18n.js`; hardcoded strings replaced with `t('ns.key')`
- Language change: save to `ht_settings.lang` → `await initLang(lang)` → `resetBuilt()` (mindfulness) → `renderAll()`
- `calm.js` updates header text in-place without destroying `#p-mindfulness` (preserves running timer)
- `journal.js` uses `SECTIONS()` function (not const) so `t()` is called at render time
- CBT distortion IDs: stored with hyphens (`all-or-nothing`), locale keys use underscores — bidirectional map maintained

### Possible next work

- Native mobile (Capacitor) background notifications
- Visual polish: legacy sub-view CSS (mood bars, cbt chips, stats heatmap) → Grove tokens
- Additional locale (e.g. Tamil, Hindi)

### State of the project (for whoever picks this up next)

The web app is a complete, offline-first PWA (root = canonical source + GitHub Pages site). The
native iOS/Android wrapper lives in **`native/`** (Capacitor) and mirrors the root web app into
its `webDir` via `npm run sync-web`; it does **not** change the web build. See
`native/README.md` for build steps.

Possible future work (none planned/required): commit-free CI for the native build; **background /
app-closed reminder scheduling** (currently only foreground reminders are bridged to
`@capacitor/local-notifications` — true background firing means pre-scheduling notifications with
the OS rather than the in-page `setInterval` timer, see `native/README.md` → Notifications); native
app icons/splash via `@capacitor/assets`; a real `appId` (currently the placeholder
`com.habittracker.app`).

### Native wrap notes (B8.1, for reference)
- `native/` is self-contained and git-ignores the generated parts (`node_modules/`, `www/`,
  `android/`, `ios/`); only `package.json`, `package-lock.json`, `capacitor.config.json`,
  `scripts/sync-web.mjs`, `.gitignore`, `README.md` are committed.
- Native-notification bridge is **additive + runtime-guarded** in `js/reminders.js`: it uses the
  injected global `window.Capacitor?.Plugins?.LocalNotifications` (no bundler import), so a plain
  browser runs the original web `Notification` path unchanged. SW registration is skipped when
  `window.Capacitor` is present (`index.html`).

### Mindfulness view notes (B7.1, for reference)
- `js/views/mindfulness.js`: pure node-tested exports `cycleSeconds(phases)` /
  `breathingState(elapsedSec, phases, totalCycles)` / `fmtTime(totalSec)` (m:ss). DOM runtime is
  timer-driven (`setInterval`), state is module-level `bf` (breathing) + `med` (meditation), **not
  persisted**. `render()` builds the panel **once** (guarded by `built`) so a live session is not
  wiped by a sync-triggered `renderAll()`.
- Circle animation is CSS-transition driven: each phase sets `transform: scale(...)` +
  `transitionDuration = secs` inline; holds reuse the prior scale (no movement). `.mf-*` CSS reuses
  `:root` tokens. Soft Web-Audio completion chime (528 Hz), fails silently if no AudioContext.

### Stats.js compute helpers (node-tested, for future reuse)
- `completedDaySets`, `currentStreak`, `longestStreak`, `heatmapWeeks`, `completionRate(daySet, windowDays)`, `areaRate(areaId, habits, sets, win)`.
- `store.js`: `dKeyFor`, `eachDailyLog`, `AREAS`/`setAreas`/`svAreas`.

### Phase 6 reuse notes (for reference)
- Pure node-tested exports: `journal.js`→`normalize`; `mood.js`→`normalizeMood`/`avgScore`/`lastNDates`; `cbt.js`→`normalizeCbt`/`intensityDelta`/`hasContent`.
- **Disclaimer pattern:** every MH view has a local `disclaimerHTML()` returning `.jr-disc` box with **Tele-MANAS 14416** + "local emergency number". Reuse verbatim.

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
| B7.1 Breathing + meditation | ✅ done | d945e42 | `js/views/mindfulness.js`, `index.html`, `js/app.js`, `js/views/_all.js`, `css/base.css`, `sw.js` | Mindfulness tab; Box 4-4-4-4 + 4-7-8 pacers (animated expand/hold/contract circle, per-phase countdown, configurable cycles) + meditation countdown (1–20 min, start/pause/resume/reset) + soft Web-Audio chime; nothing persisted; `render()` builds once; pure `cycleSeconds`/`breathingState`/`fmtTime` node-tested 10/10; ht-v13 |
| Phase 7 complete | ✅ done | 3527a53 | — | Mindfulness done (breathing pacer + meditation timer) |
| B8.1 Capacitor native | ✅ done | 208063d | `native/*` (package.json, capacitor.config.json, scripts/sync-web.mjs, .gitignore, README.md), `js/reminders.js`, `index.html`, `sw.js`, `README.md` | Self-contained `native/` Capacitor project (^8.4.0); `sync-web` mirrors root web app → `webDir` (root unchanged, stays GitHub Pages source); additive runtime-guarded native-notification bridge (`window.Capacitor` → @capacitor/local-notifications, web path unchanged); SW skipped in WebView; ht-v14. Platform builds run locally (Xcode/Android Studio). npm install resolves 94 pkgs |
| Phase 8 complete | ✅ done | a6e474a | — | Native mobile done (Capacitor iOS/Android wrap) |
| B9.1 Vendor Grove DS | ✅ done | 15a933f | `css/grove/**` (new), `assets/grove/*.svg` (new), `index.html` | Copied Grove styles/fonts/tokens/grove-ui.css from `grove-design/`; linked `css/grove/styles.css` first |
| B9.2 Token remap | ✅ done | cff5d0c | `css/tokens.css`, `css/base.css`, `js/views/settings.js`, `index.html`, `manifest.webmanifest` | Legacy var names aliased onto Grove tokens; body→`--font-ui`; paper `#faf8f3`; `theme:'system'`→`data-theme` via matchMedia |
| B9.3 Lucide + icons | ✅ done | 30a358d | `js/vendor/lucide.min.js` (new), `js/icons.js` (new), `js/ui.js`, `js/router.js`, `js/views/inbox.js`, `index.html` | Vendored lucide 0.453.0 UMD; `icon()`+`refreshIcons()`; check/pencil/x swapped; dup checkmark fixed |
| B9.4 Port kit layout CSS | ✅ done | 380ef04 | `css/grove-app.css` (new), `index.html` | Port `kit.css` minus demo chrome; link after base.css; `.tabhost` → position:fixed; prefers-reduced-motion |
| B9.5 SW + cache bump | ✅ done | b0ce8e4 | `sw.js` | Added 13 woff2+5 tokens+grove-ui.css+styles.css+grove-app.css+lucide+icons+4 SVGs; ht-v14→ht-v15; phase-complete commit |
| Phase 9 complete | ✅ done | b0ce8e4 | — | Grove foundation: fonts/tokens/SVGs/layout CSS/SW shell |
| B10.1 5-dest shell+router | ✅ done | 83f775f | `index.html`, `js/router.js`, `js/app.js`, `css/base.css`, `sw.js` | 14-tab nav → Grove bottom tabbar; 5 destination panels; registerDest(); body→flex 100dvh; ht-v15→ht-v16 |
| B10.2 Today view | ✅ done | 0249b1d | `js/views/today.js` (new), `js/views/tasks.js`, `js/views/_all.js`, `js/app.js`, `index.html`, `sw.js` | Full Grove TodayScreen: hero ring + habit cards (.grv-check) + streak badges + counters + quickadd + routine + quick wins; ht-v16→ht-v17 |
| Phase 10 complete | ✅ done | 0249b1d | — | 5-destination shell + Today view; user checkpoint passed ✅ |
| B11.1 Habits destination | ✅ done | c5bf849 | `js/views/habits.js` (new), `js/views/weekly.js`, `js/views/monthly.js`, `js/views/quarterly.js`, `js/views/yearly.js`, `index.html`, `sw.js` | Self-contained Habits destination; 5-horizon segmented control (Daily·Weekly·Monthly·Quarterly·Yearly); `.grv-progress__fill--honey` in-progress bars; counter + checkbox patterns; inline add forms per horizon; linked Q/Y habits read-only badge; null guards on legacy views; ht-v17→ht-v18 |
| Phase 11 complete | ✅ done | c5bf849 | — | Habits destination — all 5 time horizons in one Grove panel |
| B12.1 Reflect destination | ✅ done | 522f66e | `js/views/reflect.js` (new), `index.html`, `sw.js` | Thin wrapper; Grove header + 4-tab grv-seg (Mood·Journal·Thoughts·Inbox); creates #p-mood/#p-journal/#p-cbt/#p-inbox containers; delegates to existing sub-view renders; active-only render on each call; ht-v18→ht-v19 |
| Phase 12 complete | ✅ done | 522f66e | — | Reflect destination wrapping mood + journal + CBT + inbox |
| B13.1 Calm destination | ✅ done | 946f636 | `js/views/calm.js` (new), `index.html`, `sw.js` | Grove header wrapper for mindfulness.js; timer-safe guard (`el.querySelector('#p-mindfulness')` check prevents destroying active breathing/meditation session); ht-v19→ht-v20 |
| Phase 13 complete | ✅ done | 946f636 | — | Calm destination with timer-safe mindfulness wrapper |
| B14.1 You destination | ✅ done | c6d23ad | `js/views/you.js` (new), `index.html`, `sw.js` | 2-tab wrapper (Stats·Settings); dynamic Sync & Backup card appended after settings render; imports syncTrigger/loadTrigger/exportJSON/importJSON directly and wires them in _appendSync() (avoids load-time dead-wire problem); ht-v20→ht-v21 |
| Phase 14 complete | ✅ done | c6d23ad | — | You destination wrapping stats + settings + sync |
| B15.1 Cleanup + voice pass | ✅ done | d81912d | `js/app.js`, `js/views/_all.js`, `progress.md` | Removed ~50 lines of dead imports/registrations/globals from app.js (rD, rW, rM, rQ, rY, keyboard shortcuts, old sync wiring); _all.js slimmed to 5 destination wrappers; progress.md Resume section updated; ht-v21→ht-v22 |
| Phase 15 complete | ✅ done | d81912d | — | Cleanup: dead code removed, voice pass, all 15 phases COMPLETE |
| B16.1 i18n engine + English locale | ✅ done | 879d7a5 | `js/i18n.js` (new), `js/locales/en.js` (new), `js/app.js`, `js/views/settings.js`, `sw.js` | `t()` key lookup + `{token}` substitution; `initLang(lang)` dynamic import; `getLang()`; `plural(n,one,other)`; ~300 English keys across 14 namespaces; language selector (grv-seg) in Settings; `_setLang()` triggers renderAll; ht-v23→ht-v24 |
| B16.2 Malayalam locale | ✅ done | 879d7a5 | `js/locales/ml.js` (new) | Complete Malayalam translations for all ~300 keys; proper nouns/HTML/emoji preserved; language buttons always show 'English'/'മലയാളം' regardless of active lang |
| Phase 16 complete | ✅ done | 879d7a5 | — | i18n engine + English + Malayalam locales + settings UI + SW cache bump |
| B17.1 Wire t() into all views | ✅ done | 83f194b | `js/views/today.js`, `habits.js`, `reflect.js`, `calm.js`, `you.js`, `mood.js`, `journal.js`, `cbt.js`, `mindfulness.js`, `settings.js`, `inbox.js`, `stats.js` | All 12 view files: import `{ t }` from i18n.js; replace hardcoded strings; SECTIONS() fn in journal.js (render-time t()); CBT distortion ID bidirectional map (hyphens↔underscores); resetBuilt() exported from mindfulness.js; calm.js in-place header update (timer-safe lang switch) |
| Phase 17 complete | ✅ done | 83f194b | — | All views fully localised; English ↔ Malayalam switch works live |

---

## Key decisions log

| Date | Decision |
|---|---|
| 2026-06-05 | Architecture: vanilla ES modules + PWA, no build step |
| 2026-06-05 | Sequencing: foundation-first, then personal-needs → goals → motivation → mental-health |
| 2026-06-05 | Primary device: desktop while working; reminders = Notification API (foreground-reliable) |
| 2026-06-05 | Flatten nested `habit-tracker/habit-tracker/` → repo root (B0.1) |
| 2026-06-05 | Commit after every batch + phase; 70% context rule to hand off sessions cleanly |
