# Habit Tracker — Routine & Wellbeing OS

A private, offline-first **habit tracker and personal wellbeing app** built as a
zero-dependency Progressive Web App. Track daily/weekly/monthly habits, set quarterly and
yearly goals, plan your day, capture stray thoughts, and visualise your consistency with
streaks, a year heatmap, and completion stats — all stored locally on your device, with
optional Google Drive sync.

> **Philosophy:** positive reinforcement first (celebrate wins, never shame), low-friction
> capture (adding anything is ≤ 1 tap), offline-first & private by default, and a minimal,
> calm aesthetic.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
  - [Module map](#module-map)
  - [View contract](#view-contract)
  - [Data flow](#data-flow)
  - [Storage keys](#storage-keys-localstorage)
  - [Schema versioning & migration](#schema-versioning--migration)
  - [Google Drive sync & backup](#google-drive-sync--backup)
- [Project structure](#project-structure)
- [Getting started (local dev)](#getting-started-local-dev)
- [Deployment (GitHub Pages)](#deployment-github-pages)
- [Configuring Google Drive sync](#configuring-google-drive-sync)
- [Data, privacy & security](#data-privacy--security)
- [Contributing & development workflow](#contributing--development-workflow)
- [Evidence base (mental-health features)](#evidence-base-mental-health-features)
- [License](#license)

---

## Features

| Area | What you get |
|---|---|
| **Daily / Weekly / Monthly habits** | Checkbox or counter habits with per-period targets, progress bars, per-habit notes, and add/delete. |
| **Quarterly & Yearly goals** | Longer-horizon goals with counters-to-target. Goals can **link** to a lower-period habit so progress rolls up automatically (read-only) over the current quarter/year. |
| **Quick Wins** | A lightweight task list with priority (🔴/🟡/🟢) + effort, sorted by a "win score" to surface the highest-impact, lowest-effort tasks. |
| **Inbox (brain-dump)** | One-tap capture of stray thoughts; annotate, mark done, or convert an item into a Quick Win task. |
| **Routine builder** | Time-blocked daily plan: add blocks, tick them off, auto-sorted by start time. |
| **Stats** | **Streaks** (current + longest per daily habit), a GitHub-style **year heatmap**, **30/90-day completion rates**, and user-defined **Areas** (categories) with grouped completion. |
| **Eye-care reminder** | Configurable 20-20-20 timer using the Notification API, with an in-app banner and daily count. |
| **Journal** | A private daily journal with *what went well & why* (wins), lows, and growth sections — based on the *Three Good Things* exercise. Tap-to-expand history; entries stay on-device. |
| **Mood check-in** | One-tap 5-point daily mood (😞–😄) with an optional note and a 14-day trend. Non-judgemental — there's no "good" score to chase. |
| **Thought Records (CBT)** | Beck 7-column cognitive-restructuring worksheet, the Ellis **ABC(DE)** framing, and a 13-item cognitive-distortions checklist; shows the before→after emotion-intensity change. |
| **Mindfulness** | Box (4-4-4-4) and 4-7-8 **breathing pacers** with an animated expand/hold/contract guide and configurable cycles, plus a **meditation countdown timer** and a soft completion chime. Nothing is stored. |
| **Native mobile** | An optional **Capacitor** wrapper (in [`native/`](./native/)) packages this exact web app for iOS/Android, bridging reminders to native notifications — the web build is unchanged. |
| **PWA** | Installable, works offline (app-shell cache), light/dark theme toggle. |
| **Sync & backup** | Full-history Google Drive sync (opt-in) plus offline Export / Import JSON. |
| **Grove design** | All 5 destinations share a unified **Grove design system** (vendored fonts, tokens, and components): Newsreader serif headings, Hanken Grotesk UI text, sage/lavender palette, consistent cards, segmented controls, and progress bars. |

> The mental-health features (Journal, Mood, Thought Records) are **self-help tools, not a
> substitute for professional care**; each carries that disclaimer plus a crisis-resource pointer,
> and all entries stay local (and the owner's Drive only). See the
> [Evidence base](#evidence-base-mental-health-features) below.

---

## Tech stack

- **Vanilla HTML + CSS + JavaScript.** No bundler, no transpiler, no npm, no `node_modules`.
- **ES modules** (`<script type="module">`), imported with relative paths (the `.js` extension
  is required in browsers).
- **Grove design system** — vendored in-repo at `css/grove/`; provides tokens (colors,
  typography, spacing, elevation, motion), fonts (Newsreader, Hanken Grotesk, Spline Sans Mono),
  and components (`.grv-card`, `.grv-check`, `.grv-seg`, `.grv-progress`, `.grv-tabbar`).
- **Lucide icons** — vendored UMD at `js/vendor/lucide.min.js`; inline SVG via `icon()`/`refreshIcons()`.
- **localStorage** for all persistence.
- **Service Worker** for offline app-shell caching.
- **Web App Manifest** for installability.
- **Google Identity Services (GIS)** + **Google Drive API** for optional cloud sync.
- **Notification API** for reminders.

There is intentionally **no build step**. This keeps the project trivially deployable to a
static host and means wrapping it with **Capacitor** for native iOS/Android stays
straightforward (keep code DOM-centric, avoid bundler-only idioms). That native wrapper now
lives in [`native/`](./native/) — it mirrors this same web app into a Capacitor shell without
changing the web build; see [`native/README.md`](./native/README.md). The root remains the
canonical PWA and the GitHub Pages source.

---

## Architecture

The app boots from `js/app.js`, which initialises the store, registers five **destination
views** with the router, and navigates to Today. Each destination is a self-contained Grove
wrapper module under `js/views/`; feature sub-views are delegated from there. Shared concerns
(state, persistence, sync, UI helpers, routing, reminders) live in top-level `js/` modules.

### Module map

```
index.html              ← app shell; 5 [data-dest-panel] divs + Grove bottom tabbar
manifest.webmanifest
sw.js                   ← app-shell cache; bump CACHE const on every shell-file change
icons/                  ← PWA icons
css/
  grove/                ← Grove design system (vendored)
    styles.css          ← main entry (imports tokens + components)
    tokens/             ← colors.css, typography.css, spacing.css, elevation.css, motion.css
    fonts/              ← fonts.css + woff2 (Newsreader, Hanken Grotesk, Spline Sans Mono)
    components/
      grove-ui.css      ← .grv-card, .grv-check, .grv-seg, .grv-progress, .grv-tabbar, …
  tokens.css            ← legacy var aliases mapped onto Grove tokens
  base.css              ← per-feature legacy styles (.hc, .hm-*, .mf-*, .cbt-*, …)
  grove-app.css         ← ported kit layout (.screen, .scr-head, .scr-eyebrow, .tabhost, …)
js/
  app.js                ← bootstrap: init → register 5 destination views → sw('today')
  store.js              ← state, localStorage, schema v3, migration, date-key helpers, goal-linking
  sync.js               ← Google Drive OAuth + full-history payload + Export/Import JSON
  ui.js                 ← toast(), mkCard(), mkSum(), SVG helpers
  router.js             ← registerView/registerDest/sw(); toggles [data-dest-panel] hidden attrs
  icons.js              ← icon(name, opts) → inline SVG; refreshIcons() → lucide.createIcons()
  reminders.js          ← recurring timer engine + Notification API, native-aware
  vendor/
    lucide.min.js       ← vendored Lucide icon UMD (0.453.0)
  views/
    today.js            ← Today destination (ring, habit cards, routine, quick wins)
    habits.js           ← Habits destination (5-horizon segmented control)
    reflect.js          ← Reflect destination → mood.js / journal.js / cbt.js / inbox.js
    calm.js             ← Calm destination → mindfulness.js (timer-safe re-render guard)
    you.js              ← You destination → stats.js / settings.js + Grove Sync card
    daily.js weekly.js monthly.js quarterly.js yearly.js  ← legacy (null-guarded)
    tasks.js inbox.js routine.js stats.js settings.js
    journal.js mood.js cbt.js mindfulness.js
    notes.js            ← shared note-editing behaviour
    _all.js             ← renderAll() — calls the 5 destination wrappers (used by sync restore)
assets/grove/           ← Grove brand SVGs
native/                 ← Capacitor iOS/Android wrapper; see native/README.md
```

### 5-destination IA

| Destination | Panel | Sub-views |
|---|---|---|
| **Today** | `#p-today` | ring hero, daily habits, routine, quick wins |
| **Habits** | `#p-habits` | Daily · Weekly · Monthly · Quarterly · Yearly (segmented) |
| **Reflect** | `#p-reflect` | Mood · Journal · Thoughts · Inbox (segmented) |
| **Calm** | `#p-calm` | Breathing pacers + meditation timer |
| **You** | `#p-you` | Stats · Settings + Sync & Backup (segmented) |

### View contract

Every view module exports:

- `render()` — refreshes the view's DOM from current store state.
  - **Destination wrappers** (`today.js`, `habits.js`, `reflect.js`, `calm.js`, `you.js`) own
    the Grove header + sub-containers; each `render()` sets the panel's `innerHTML` and calls
    the active sub-view.
  - **Sub-views** (`mood.js`, `stats.js`, etc.) find their container via `document.getElementById`
    and always guard with `if (!el) return;` at the top.
  - **`calm.js`** additionally checks `el.querySelector('#p-mindfulness')` before rebuilding —
    preserving an active breathing/meditation timer session across re-renders.

**Conventions:**

- Split compute from rendering — e.g. `stats.js` exports pure, node-testable helpers
  (`currentStreak`, `longestStreak`, `heatmapWeeks`, `completionRate`, `areaRate`) above a
  `── Render ──` divider.
- Follow the existing terse helper style (`dKey`, `sv`, `lsGet`, `p2`).
- Grove component classes: `.grv-card`, `.grv-check.grv-check--round`, `.grv-seg/.grv-seg__opt`,
  `.grv-progress/.grv-progress__fill`, `.grv-tabbar/.grv-tab`, `.grv-btn`, `.grv-iconbtn`.
- Legacy CSS uses BEM-lite, per-feature namespace (`.hc`, `.hm-*`, `.mf-*`, `.cbt-*`, etc.).

### Data flow

```
user action → view handler mutates in-memory state (e.g. HABITS, ROUTINE, AREAS)
            → sv*/save helper writes to localStorage
            → scheduleSync() debounces a Drive push (if signed in)
            → view re-renders from state
```

`store.js` holds the canonical in-memory state and exposes setters + save helpers
(`sv()`, `svHabits()`, `svRoutine()`, `svAreas()`, …). After a Drive/JSON restore,
`sync.js` calls `store.loadAll()` then `views/_all.js#renderAll()` to repaint everything.

### Storage keys (localStorage)

| Key pattern | Content |
|---|---|
| `ht_schema_version` | integer; **current = 3** |
| `ht_habits` | `{ daily[], weekly[], monthly[], quarterly[], yearly[] }` — habit/goal definitions |
| `ht_d_YYYY-MM-DD` | daily log `{ [habitId]: bool/number, remarks: {} }` |
| `ht_w_YYYY-W##` | weekly log `{ [habitId]: number, remarks: {} }` |
| `ht_m_YYYY-MM` | monthly log |
| `ht_q_YYYY-Q#` | quarterly log |
| `ht_y_YYYY` | yearly log |
| `ht_qw` | Quick Wins task array |
| `ht_inbox` | brain-dump items |
| `ht_routine` | routine blocks |
| `ht_areas` | area/category definitions |
| `ht_reminders` | reminder configs |
| `ht_settings` | user prefs (theme, reminder defaults) |
| `ht_lastsync` | last Drive sync timestamp |
| `ht_journal_YYYY-MM-DD` | daily journal `{ wins[], lows[], growth[] }` |
| `ht_mood_YYYY-MM-DD` | daily mood check-in `{ score, note }` |
| `ht_cbt` | CBT/REBT thought-record array |

### Schema versioning & migration

On startup, `store.js#initSchema()` reads `ht_schema_version`. If it's below the current
target, `migrate(from)` runs. **Migrations are idempotent and additive — they never delete
existing keys or data.**

- **v1 → v2:** ensure `ht_habits` has `quarterly`/`yearly` arrays; ensure all period logs have
  a `remarks` map.
- **v2 → v3:** ensure `ht_areas` exists.

When adding a feature that needs new storage, bump `SCHEMA_VERSION` and add a new additive
block — don't mutate older blocks.

### Google Drive sync & backup

- `buildPayload()` collects **every** `ht_*` key into one JSON object, so Drive (or an exported
  file) holds the complete history — switching devices restores everything.
- `restorePayload(data)` writes every `ht_*` key back, then reloads + re-renders.
- Sync is **opt-in** and debounced (`scheduleSync()` pushes ~20s after a change, only when
  signed in). Scope requested is `drive.file` (the app can only see files it created).
- Offline alternative: **Export JSON** downloads a backup; **Import JSON** restores one
  (supports the current flat `ht_*` format and an older nested format).

---

## Project structure

```
habit-tracker/
├── index.html               # app shell; 5 destination panels + Grove tabbar
├── manifest.webmanifest     # PWA manifest
├── sw.js                    # service worker (app-shell cache; currently ht-v22)
├── icons/                   # PWA icons
├── assets/
│   └── grove/               # Grove brand SVGs (grove-icon, grove-mark, grove-wordmark)
├── css/
│   ├── grove/               # Grove design system (vendored)
│   │   ├── styles.css       # main entry
│   │   ├── tokens/          # colors, typography, spacing, elevation, motion
│   │   ├── fonts/           # fonts.css + woff2 files
│   │   └── components/
│   │       └── grove-ui.css # Grove component classes
│   ├── tokens.css           # legacy var aliases → Grove tokens
│   ├── base.css             # per-feature legacy styles
│   └── grove-app.css        # ported kit layout classes
├── js/
│   ├── app.js               # bootstrap: registers 5 destinations, calls sw('today')
│   ├── store.js             # state + persistence + schema migration
│   ├── sync.js              # Drive sync + Export/Import
│   ├── ui.js                # shared UI helpers (toast, mkCard, …)
│   ├── router.js            # registerView/registerDest/sw()
│   ├── icons.js             # icon() + refreshIcons() (Lucide wrapper)
│   ├── reminders.js         # reminder engine + Notification API
│   ├── vendor/
│   │   └── lucide.min.js    # vendored Lucide UMD (0.453.0)
│   └── views/
│       ├── today.js         # Today destination (self-contained)
│       ├── habits.js        # Habits destination (5-horizon segmented)
│       ├── reflect.js       # Reflect destination wrapper
│       ├── calm.js          # Calm destination wrapper
│       ├── you.js           # You destination wrapper
│       ├── daily.js weekly.js monthly.js quarterly.js yearly.js  # legacy (null-guarded)
│       ├── mood.js journal.js cbt.js mindfulness.js              # feature sub-views
│       ├── stats.js settings.js tasks.js inbox.js routine.js     # feature sub-views
│       ├── notes.js         # shared note-editing behaviour
│       └── _all.js          # renderAll() (called by sync restore)
├── native/                  # optional Capacitor iOS/Android wrapper (see native/README.md)
└── README.md
```

---

## Getting started (local dev)

ES modules require an HTTP server — opening `index.html` via `file://` will **not** work.

```bash
# from the repo root
python -m http.server 8000
# then open http://localhost:8000/
```

Or, if you prefer Node:

```bash
npx serve .
```

No install, no build. Edit a file, reload the page.

**Verifying a change:**

```bash
# syntax-check changed modules (no test framework; Node is used only as a linter/runner)
node --check js/views/stats.js

# pure compute helpers can be unit-tested in plain Node (they take no DOM/localStorage)
node -e '/* import or inline a helper and assert outputs */'
```

> **Service worker note:** the SW caches the app shell. After changing a cached file, bump the
> `CACHE` constant in `sw.js` (currently `ht-v22`) so returning users fetch the fresh copy.
> During local dev, use your browser's "Update on reload" / "Bypass for network" devtools option.

---

## Deployment (GitHub Pages)

The app deploys as a **static site from the repo root of `main`** — no CI/Actions required.

1. Push to `main`.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. The site publishes at `https://<user>.github.io/habit-tracker/`.

Notes:
- `index.html` must stay at the repo root.
- All asset paths and the service worker use **relative** URLs (`./...`), so the app works
  correctly under the `/habit-tracker/` base path. The manifest's `start_url`/`scope` are set to
  `/habit-tracker/` to match. If you fork under a different repo name, update those two fields.
- After deploying a shell change, the bumped SW `CACHE` version ensures clients update.

---

## Configuring Google Drive sync

Drive sync is optional. To enable it (for your own deployment), you need a Google OAuth
**Client ID**:

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a project and
   enable the **Google Drive API**.
2. Configure an **OAuth consent screen** (External; add yourself as a test user).
3. Create an **OAuth client ID** of type **Web application**. Add your origins to
   *Authorized JavaScript origins* (e.g. `http://localhost:8000` and
   `https://<user>.github.io`).
4. Put the client ID in `js/sync.js`:
   ```js
   const GOOGLE_CLIENT_ID = '<your-client-id>.apps.googleusercontent.com';
   ```

The requested scope is `drive.file`, so the app can only access the single backup file it
creates (`habit-tracker-backup.json`) — it cannot see the rest of your Drive.

> If `GOOGLE_CLIENT_ID` is left unset, the sync buttons simply report that Drive isn't set up;
> the rest of the app (and Export/Import JSON) works fully offline without it.

---

## Data, privacy & security

- **Local-first & private.** All data lives in your browser's `localStorage`. Nothing is sent
  anywhere unless you explicitly sign in and sync.
- **You own your data.** Export a full JSON backup anytime; import it on any device.
- **Drive sync is opt-in** and uses the narrow `drive.file` scope.
- **Mental-health entries** (Journal, Mood, Thought Records) stay local + the owner's Drive
  only, and ship with a "self-help tool, not a substitute for professional care" disclaimer
  plus a crisis-resource pointer.
- The OAuth **client ID is not a secret** (it's a public identifier and safe to commit); there
  are no server-side secrets in this project.

---

## Contributing & development workflow

Keep changes consistent with the existing modules and the [Architecture](#architecture)
described above.

**Guidelines:**

1. **Stay lean.** No dependencies, no build step. Reuse design tokens and existing components.
   Split compute from rendering; keep functions small.
2. **Match the data model.** Use the documented storage keys; if you add one, add an additive
   migration and bump `SCHEMA_VERSION`.
3. **Update the service worker.** If you add or change a cached shell file, add it to `SHELL`
   in `sw.js` and bump the `CACHE` version.

**Commits.** Use **conventional commit messages**, one per logical unit of work, e.g.
`feat(stats): streaks`, `fix(routine): sort blocks by start time`, `docs: update README`.

**Verification.** There's no test framework; Node is used as a linter/runner. Before committing:

1. `node --check` each changed module.
2. Unit-test any new **pure** logic in plain Node (the compute helpers take no DOM/localStorage,
   so they're easy to assert on directly).
3. Run `python -m http.server 8000`, then confirm the affected tab renders correctly **and**
   prior tabs still work.

**Design principles (apply to every change):**

1. Positive reinforcement first — celebrate wins, never shame.
2. Low-friction capture — adding anything is ≤ 1 tap.
3. Offline-first & private by default.
4. Preserve the minimal aesthetic — reuse `:root` tokens, no UI frameworks.
5. Evidence-based wellbeing — mental-health features cite published methods and include the
   self-help disclaimer + crisis pointer.

---

## Evidence base (mental-health features)

The mental-health features are grounded in published methods:

| Feature | Method | Source |
|---|---|---|
| Journal "what went well & why" | *Three Good Things* — Seligman et al. 2005 RCT | ggia.berkeley.edu; uchealth.org |
| Thought Record | Beck CBT 7-column cognitive restructuring | psychologytools.com; blueprint.ai |
| ABC(DE) model | Ellis REBT — Activating event → Beliefs → Consequences → Disputation → Effect | positivepsychology.com |
| Cognitive distortions checklist | 13 types (all-or-nothing, catastrophizing, …) | simplypsychology.org; healthline.com |
| Eye care | 20-20-20 rule; preservative-free drops for frequent use | healthline.com; aoa.org |

> These features are self-help tools, **not** a substitute for professional care.

---

## License

No license has been declared yet — this is a personal project. If you intend to reuse or
distribute it, please open an issue to discuss licensing first.
