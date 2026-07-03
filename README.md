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

## Desktop App (Electron)

The same app can run as a Windows desktop application. It connects to the same Firebase backend, so data stays in sync with the web version.

- `npm run electron:dev` — launch the desktop window in development mode (with hot reload)
- `npm run electron:build` — build the production installer at `release/ChronosGrid-Setup-<version>.exe`
- `npm run electron:release` — build the installer **and** copy the installer + `latest.yml` update manifest into `public/download/` (used by both the web download button and the desktop auto-updater)

The installer supports choosing the install directory and creates desktop/start menu shortcuts.

### Auto-updates

The desktop app checks for updates on startup and every 30 minutes, downloads them in
the background, and shows an alert in the sidebar with a "Restart & update" button.

Update server: configured in `package.json` under `build.publish` (currently the
placeholder `https://chronosgrid.web.app/download/`). **Change this URL to your real
Firebase Hosting domain before release.** The app fetches `latest.yml` and the installer
from `<url>/`, which is exactly what `npm run electron:release` places in `public/download/`.

Release flow:
1. Bump `version` in `package.json` and the `APP_VERSION`/installer URL in
   `src/components/Desktop/DesktopAppView.tsx`.
2. Run `npm run electron:release`.
3. Deploy the site (which serves `public/download/`) to Firebase Hosting.

Existing installs will detect the new `latest.yml`, download the update, and offer to restart.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build
- `npm run lint` — type-check with `tsc --noEmit`
