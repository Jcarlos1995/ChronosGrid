/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateStatus {
  state: UpdateState;
  version?: string;
  percent?: number;
  message?: string;
}

export interface DesktopUpdaterBridge {
  isDesktop: boolean;
  onStatus: (callback: (status: UpdateStatus) => void) => () => void;
  requestStatus: () => void;
  installNow: () => void;
}

declare global {
  interface Window {
    desktopUpdater?: DesktopUpdaterBridge;
  }
}

export {};
