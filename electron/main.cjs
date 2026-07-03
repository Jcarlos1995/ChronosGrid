/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = !!process.env.ELECTRON_START_URL;

// Last known update status, so the renderer can request it on mount.
let lastStatus = { state: 'idle' };
let mainWindow = null;

// Do not auto-download; we control the flow and report progress to the UI.
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function sendStatus(status) {
  lastStatus = status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', status);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'ChronosGrid',
    autoHideMenuBar: true,
    backgroundColor: '#F8FAFC',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Open external http/https links in the system browser instead of the app window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// ----- Auto-update wiring (packaged builds only) -----
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => sendStatus({ state: 'checking' }));
  autoUpdater.on('update-available', (info) =>
    sendStatus({ state: 'available', version: info.version })
  );
  autoUpdater.on('update-not-available', () => sendStatus({ state: 'idle' }));
  autoUpdater.on('download-progress', (progress) =>
    sendStatus({ state: 'downloading', percent: Math.round(progress.percent) })
  );
  autoUpdater.on('update-downloaded', (info) =>
    sendStatus({ state: 'downloaded', version: info.version })
  );
  autoUpdater.on('error', (err) =>
    sendStatus({ state: 'error', message: err == null ? 'unknown' : String(err.message || err) })
  );

  ipcMain.on('update-request-status', (event) => {
    event.sender.send('update-status', lastStatus);
  });
  ipcMain.on('update-install-now', () => {
    autoUpdater.quitAndInstall();
  });

  // Check on startup, then every 30 minutes.
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 30 * 60 * 1000);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  if (!isDev) {
    setupAutoUpdater();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
