/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSettings } from '../types';

export interface EffectiveGeminiKey {
  key: string | null;
  source: 'own' | 'admin' | null;
  // true when the only available key was an admin-assigned one that expired
  adminExpired: boolean;
}

// Resolves which Gemini API key the app should use:
// the user's own key wins; otherwise the admin-assigned key while it is valid.
export function getEffectiveGeminiKey(settings: AppSettings): EffectiveGeminiKey {
  const own = (settings.geminiApiKey || '').trim();
  if (own) return { key: own, source: 'own', adminExpired: false };

  const adminKey = (settings.adminApiKey || '').trim();
  if (adminKey) {
    const expiresAt = settings.adminApiKeyExpiresAt || 0;
    if (expiresAt > Date.now()) {
      return { key: adminKey, source: 'admin', adminExpired: false };
    }
    return { key: null, source: null, adminExpired: true };
  }

  return { key: null, source: null, adminExpired: false };
}

// True while an admin-assigned key exists and is still valid
export function isAdminKeyActive(settings: Pick<AppSettings, 'adminApiKey' | 'adminApiKeyExpiresAt'>): boolean {
  return !!(settings.adminApiKey || '').trim() && (settings.adminApiKeyExpiresAt || 0) > Date.now();
}
