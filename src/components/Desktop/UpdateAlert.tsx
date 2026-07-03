/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, RefreshCw, RotateCw, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { UpdateStatus } from '../../window';

interface UpdateAlertProps {
  status: UpdateStatus;
  onInstall: () => void;
}

// Compact update banner shown inside the desktop app's sidebar.
// Renders nothing while idle or merely checking for updates.
export const UpdateAlert: React.FC<UpdateAlertProps> = ({ status, onInstall }) => {
  const { t } = useLanguage();

  const visible =
    status.state === 'available' ||
    status.state === 'downloading' ||
    status.state === 'downloaded' ||
    status.state === 'error';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className={`mb-4 p-3 rounded-xl border ${
            status.state === 'error'
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-indigo-500/10 border-indigo-500/30'
          }`}
        >
          {status.state === 'available' && (
            <div className="flex items-start gap-2.5">
              <Download className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  {t('update.availableTitle')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {t('update.availableMessage', { version: status.version || '' })}
                </p>
              </div>
            </div>
          )}

          {status.state === 'downloading' && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-spin" />
                <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  {t('update.downloadingTitle')}
                </p>
                <span className="ml-auto text-[10px] font-mono text-slate-400">{status.percent ?? 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${status.percent ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {status.state === 'downloaded' && (
            <div>
              <div className="flex items-start gap-2.5 mb-2.5">
                <RotateCw className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    {t('update.readyTitle')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {t('update.readyMessage', { version: status.version || '' })}
                  </p>
                </div>
              </div>
              <button
                onClick={onInstall}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                <RotateCw className="w-3.5 h-3.5" /> {t('update.restartBtn')}
              </button>
            </div>
          )}

          {status.state === 'error' && (
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
                  {t('update.errorTitle')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{t('update.errorMessage')}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
