/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { UpdateStatus } from '../window';

// Subscribes to desktop auto-update status. On the web (no Electron bridge)
// it stays idle and the sidebar alert never renders.
export function useDesktopUpdater() {
  const bridge = typeof window !== 'undefined' ? window.desktopUpdater : undefined;
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });

  useEffect(() => {
    if (!bridge) return;
    const unsubscribe = bridge.onStatus(setStatus);
    bridge.requestStatus();
    return unsubscribe;
  }, [bridge]);

  return {
    isDesktop: !!bridge,
    status,
    installNow: () => bridge?.installNow(),
  };
}
