# Habit Tracker — Flutter app

A native (Android/iOS) port of the web app in the repo root, written to the
same design and architecture principles:

- **Offline-first & private** — every byte stays on the device. The only
  dependency is `shared_preferences`, used as a drop-in for the web app's
  `localStorage` with the **same keys and JSON shapes** (`ht_habits`,
  `ht_d_YYYY-MM-DD`, `ht_qw`, `ht_journal_*`, `ht_mood_*`, `ht_cbt`, …,
  `ht_schema_version` = 3). A JSON backup made here mirrors those keys, so
  data can move between the PWA and this app.
- **Grove design system** — colors in `lib/theme/grove_theme.dart` are ported
  from `css/grove/tokens/colors.css` (light + dark), and the shared widgets in
  `lib/widgets/grove.dart` mirror `.grv-card`, `.grv-seg`, `.grv-check`,
  `.grv-progress`, the eyebrows and screen headers.
- **i18n** — `lib/core/i18n.dart` ports `js/i18n.js` (`t()`, `plural()`), with
  complete English + Malayalam string tables in `lib/core/locales/`.
- **Positive reinforcement, low-friction capture, evidence-based wellbeing** —
  same copy, same disclaimers, same crisis pointers as the web app.

## Layout

```
lib/
  main.dart                 bootstrap + 5-tab shell (Today · Habits · Reflect · Calm · You)
  core/
    store.dart              state + persistence (port of js/store.js), ChangeNotifier
    i18n.dart               t(key, vars) / plural()
    locales/en.dart, ml.dart
  theme/grove_theme.dart    Grove tokens as a ThemeExtension (light + dark)
  widgets/                  GroveCard, GroveSeg, RoundCheck, ProgressRing, …
  screens/
    today_screen.dart       ring · daily habits · routine · quick wins
    habits_screen.dart      all 5 horizons, add/delete, targets, goal links
    reflect_screen.dart     wrapper → mood / journal / cbt / inbox views
    calm_screen.dart        breathing pacer (box, 4-7-8) + meditation timer
    you_screen.dart         wrapper → stats / settings views
```

The shell keeps destinations in an `IndexedStack`, so a running breathing or
meditation session survives tab switches (the native equivalent of the
`calm.js` re-render guard).

## First-time setup (next session)

The repo intentionally contains **only the Dart code** — platform folders are
generated, not hand-written:

```bash
cd flutter_app
flutter create . --platforms=android,ios   # generates android/ + ios/
flutter pub get
flutter run                                 # device or emulator
flutter analyze                             # should be clean; fix anything it flags
```

This code was written without a Flutter SDK on the machine (not yet
compiled), so expect `flutter analyze` to be the first gate.

## Deliberately deferred (parity gaps vs the web app)

- **Reminders / notifications** — needs `flutter_local_notifications`; the
  Settings screen shows a note meanwhile.
- **Google Drive sync** — replaced for now by clipboard JSON backup/restore
  in Settings (same `ht_*` key map).
- **Areas** grouping in Stats, **per-habit heatmaps** (one overall heatmap is
  shown), and **goal-link auto-feeding** (links are displayed, counters are
  manual) — port later from `js/views/stats.js` / `js/store.js`.
- **Grove fonts** (Newsreader etc.) — headers use the platform serif; add the
  `.ttf`s under `assets/fonts/` + `pubspec.yaml` when wanted.
