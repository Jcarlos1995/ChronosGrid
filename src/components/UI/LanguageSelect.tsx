/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Globe } from 'lucide-react';
import { languages, LanguageCode } from '../../i18n/translations';

interface LanguageSelectProps {
  value: LanguageCode;
  onChange: (lang: LanguageCode) => void;
  className?: string;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({ value, onChange, className }) => {
  return (
    <div className={`relative ${className || ''}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Globe className="h-4 w-4" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-xs transition-all cursor-pointer"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName} ({l.englishName})
          </option>
        ))}
      </select>
    </div>
  );
};
