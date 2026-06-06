# Habit Tracker — Native (Capacitor) wrapper

This folder wraps the **exact same web app** that lives at the repo root in a
[Capacitor](https://capacitorjs.com/) shell so it can ship to **iOS and Android**
app stores — with no rewrite, no bundler, and no changes to how the PWA is built.

The web app at the repo root stays the single source of truth (and the GitHub
Pages site). This project just **mirrors** those assets into `./www` (Capacitor's
`webDir`) and adds the native platform projects around them.

```
repo root (the PWA)  ──[ npm run sync-web ]──►  native/www  ──►  android/ , ios/
```

Nothing here is needed to run or deploy the web app. The root `index.html` keeps
working unchanged in a browser; this is purely the native packaging.

---

## Prerequisites

| Target | You need |
|---|---|
| Both | [Node.js](https://nodejs.org/) 18+ and npm |
| Android | [Android Studio](https://developer.android.com/studio) (SDK + an emulator or a device) |
| iOS | macOS with [Xcode](https://developer.apple.com/xcode/) + [CocoaPods](https://cocoapods.org/) (`sudo gem install cocoapods`) |

> iOS can **only** be built on macOS. Android can be built on Windows, macOS, or Linux.

---

## First-time setup

From this `native/` folder:

```bash
# 1. install the Capacitor toolchain (creates node_modules/, gitignored)
npm install

# 2. copy the web app into ./www  (Capacitor's webDir)
npm run sync-web

# 3. add the platform(s) you want — these scaffold android/ and/or ios/
npm run add:android      # → creates native/android (Gradle project)
npm run add:ios          # → creates native/ios   (Xcode project, macOS only)
```

`add:android` / `add:ios` run `sync-web` first, so `./www` is always fresh.

---

## Day-to-day: after changing the web app

Whenever you edit anything at the repo root (HTML/CSS/JS), re-mirror it and push
it into the native projects:

```bash
npm run cap:sync         # = sync-web + `cap sync`  (copies www + updates native deps)
```

Then open the native IDE to run / build / archive:

```bash
npm run open:android     # opens Android Studio
npm run open:ios         # opens Xcode (macOS)
```

Press **Run** in the IDE to launch on an emulator/simulator or a connected device.

---

## App identity

Edit [`capacitor.config.json`](./capacitor.config.json) **before** adding platforms:

```json
{
  "appId":   "com.habittracker.app",   // ← change to your own reverse-DNS id
  "appName": "Habit Tracker",
  "webDir":  "www"
}
```

- `appId` becomes the Android `applicationId` / iOS bundle identifier — pick a
  unique reverse-DNS string you control (e.g. `io.github.<you>.habittracker`).
  Changing it later means re-adding the platforms.

---

## App icons & splash

The web PWA ships only an SVG icon; native stores need raster icons + a splash.
The simplest path is the official asset generator:

```bash
npm install --save-dev @capacitor/assets
# place a 1024×1024 PNG at native/assets/icon.png (and optionally splash.png)
npx capacitor-assets generate
```

This writes the platform icon/splash sets into `android/` and `ios/`. (A
`@capacitor/local-notifications` status-bar icon named `ic_stat_icon` is
referenced in `capacitor.config.json` — the asset generator creates it, or you
can add it manually under the Android `drawable` resources.)

---

## Notifications

The web app's reminder engine (`js/reminders.js`) uses the browser Notification
API. It now **progressively enhances** to native notifications: when it detects
it's running inside Capacitor (`window.Capacitor`), it routes reminder alerts
through `@capacitor/local-notifications` instead of the web API; in a plain
browser the original web path is used unchanged.

This covers **foreground** reminders (the app open, timer ticking) on device.
True **background / app-closed** scheduling — firing a reminder while the app
isn't running — is a larger change: it would pre-schedule notifications with the
OS (e.g. `LocalNotifications.schedule` with future `at` times / repeats) rather
than relying on the in-page `setInterval` timer. That's a deliberate follow-up,
not part of this initial wrap.

On Android 13+ the app must request the `POST_NOTIFICATIONS` runtime permission;
`requestNotificationPermission()` does this via the plugin when native.

---

## What's committed vs. generated

Committed (small, hand-authored):

- `package.json`, `capacitor.config.json`, `scripts/sync-web.mjs`, this README.

Generated locally and **git-ignored** (rebuilt from the web app + config):

- `node_modules/`, `www/`, `android/`, `ios/`.

This keeps the repo lean and the GitHub Pages root untouched. A fresh clone just
runs the **First-time setup** steps above to reproduce the native projects.

---

## Troubleshooting

- **`cap: command not found`** — run the npm scripts (`npm run cap:sync`), which
  use the local `@capacitor/cli`, rather than a bare `cap`.
- **White screen on launch** — you probably edited the web app without re-running
  `npm run cap:sync`; `./www` was stale.
- **Stale assets after an update** — the service worker is intentionally **not**
  registered inside the Capacitor WebView (Capacitor already serves the bundled
  assets), so a `cap:sync` + rebuild always ships the latest files.
