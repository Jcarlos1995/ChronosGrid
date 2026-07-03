/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { contextBridge, ipcRenderer } = require('electron');

// Secure bridge exposed to the renderer (React) as window.desktopUpdater.
// Lets the web UI subscribe to auto-update status and trigger the install.
contextBridge.exposeInMainWorld('desktopUpdater', {
  isDesktop: true,
  // Subscribe to update lifecycle events. Returns an unsubscribe function.
  onStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },
  // Ask the current status once (useful right after the component mounts).
  requestStatus: () => ipcRenderer.send('update-request-status'),
  // Quit and install the downloaded update.
  installNow: () => ipcRenderer.send('update-install-now'),
});
