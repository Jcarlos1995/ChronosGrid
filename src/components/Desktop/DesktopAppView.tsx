/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Monitor, Download, CheckCircle, Info, AppWindow, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../i18n/LanguageContext';

const APP_VERSION = '1.0.7';
// Installer is hosted on GitHub Releases (asset attached to the vX.Y.Z tag)
const INSTALLER_URL = `https://github.com/Jcarlos1995/ChronosGrid/releases/download/v${APP_VERSION}/ChronosGrid-Setup-${APP_VERSION}.exe`;
const APP_SIZE = '111 MB';
const APP_PLATFORM = 'Windows 10/11 (x64)';

// The desktop app runs inside Electron, whose user agent includes "Electron"
const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');

export const DesktopAppView: React.FC = () => {
  const { t } = useLanguage();

  if (isElectron) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-lg flex items-center gap-4 max-w-2xl shadow-sm">
        <Monitor className="w-8 h-8 text-emerald-600 shrink-0" />
        <div>
          <h4 className="text-md font-bold uppercase tracking-wider">{t('desktop.alreadyTitle')}</h4>
          <p className="text-sm mt-1">{t('desktop.alreadyMessage')}</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: AppWindow, text: t('desktop.feature1') },
    { icon: RefreshCw, text: t('desktop.feature2') },
    { icon: Layers, text: t('desktop.feature3') },
  ];

  const steps = [t('desktop.step1'), t('desktop.step2'), t('desktop.step3')];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden"
      >
        <div className="p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 border border-indigo-500 flex items-center justify-center shrink-0 shadow-lg">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">
              {t('desktop.badge')}
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('desktop.title')}
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              {t('desktop.subtitle')}
            </p>
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <a
            href={INSTALLER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 duration-200 cursor-pointer"
          >
            <Download className="w-4 h-4" /> {t('desktop.downloadBtn')}
          </a>

          <div className="flex items-center gap-5 text-xs font-mono text-slate-400">
            <span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">{t('desktop.version')}</span>
              v{APP_VERSION}
            </span>
            <span className="h-6 w-[1px] bg-slate-700" />
            <span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">{t('desktop.size')}</span>
              {APP_SIZE}
            </span>
            <span className="h-6 w-[1px] bg-slate-700" />
            <span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">{t('desktop.platform')}</span>
              {APP_PLATFORM}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Features */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-3 mb-4 border-b border-slate-200">
            {t('desktop.featuresTitle')}
          </h3>
          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-700 mt-1.5">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Install Steps */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-3 mb-4 border-b border-slate-200">
            {t('desktop.installStepsTitle')}
          </h3>
          <ol className="space-y-4">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 font-mono">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-700">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-2.5 bg-amber-50/60 border border-amber-100 rounded-lg p-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{t('desktop.smartScreenNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
