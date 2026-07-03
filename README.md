# ChronosGrid — Task Calendar & Cost Tracker

A grid-based calendar application with task scheduling, expense tracking, multi-currency settings, an analytics dashboard, and role-based admin user management. Built with React, TypeScript, Vite, Tailwind CSS, and Firebase (Auth + Firestore).

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Open http://localhost:3000

Firebase configuration lives in [src/firebase.ts](src/firebase.ts) and Firestore security rules are in [firestore.rules](firestore.rules).

## Deployment

- **Web:** hosted on Firebase Hosting at https://calendar-caf64.web.app (project `calendar-caf64`).
  Deploy with `firebase deploy --only hosting` (auth via the `serviceAccount.json`, kept out of git).
- **Firestore:** rules ([firestore.rules](firestore.rules)) and indexes ([firestore.indexes.json](firestore.indexes.json))
  deploy with `firebase deploy --only firestore`.
- **Desktop installer:** distributed via GitHub Releases at
  https://github.com/Jcarlos1995/ChronosGrid/releases (Firebase's free plan forbids hosting `.exe`).

## Desktop App (Electron)

The same app can run as a Windows desktop application. It connects to the same Firebase backend, so data stays in sync with the web version.

- `npm run electron:dev` — launch the desktop window in development mode (with hot reload)
- `npm run electron:build` — build the production installer at `release/ChronosGrid-Setup-<version>.exe`
- `npm run electron:publish` — build the installer and publish it (+ `latest.yml`) to a GitHub Release. Requires `GH_TOKEN`.

The installer supports choosing the install directory and creates desktop/start menu shortcuts.

### Auto-updates

The desktop app checks for updates on startup and every 30 minutes, downloads them in
the background, and shows an alert in the sidebar with a "Restart & update" button.

Update source: GitHub Releases, configured in `package.json` under `build.publish`
(`github` provider, `Jcarlos1995/ChronosGrid`). The app reads `latest.yml` from the
latest release and downloads the installer asset.

Release flow for a new version:
1. Bump `version` in `package.json` and `APP_VERSION` in
   [src/components/Desktop/DesktopAppView.tsx](src/components/Desktop/DesktopAppView.tsx).
2. `GH_TOKEN=<token> npm run electron:publish` — builds and publishes the release.
3. `npm run build && firebase deploy --only hosting` — updates the web download button.

Existing installs detect the new release, download it, and offer to restart.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build
- `npm run lint` — type-check with `tsc --noEmit`
