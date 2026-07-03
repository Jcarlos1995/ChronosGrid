/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { updatePassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase';
import { AppSettings, UserProfile } from '../../types';
import { currencies } from '../../currencies';
import { Settings, Save, Lock, CircleAlert, Globe, Palette, Info, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageSelect } from '../UI/LanguageSelect';

interface SettingsViewProps {
  userProfile: UserProfile;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  settings,
  onUpdateSettings,
  addToast,
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [currency, setCurrency] = useState(settings.currency);
  const [weekStartMonday, setWeekStartMonday] = useState(settings.weekStartMonday);

  // Custom Category Colors
  const [appointmentColor, setAppointmentColor] = useState(settings.categoryColors['Appointment'] || '#3b82f6');
  const [workColor, setWorkColor] = useState(settings.categoryColors['Work'] || '#ef4444');
  const [personalColor, setPersonalColor] = useState(settings.categoryColors['Personal'] || '#10b981');
  const [otherColor, setOtherColor] = useState(settings.categoryColors['Other'] || '#8b5cf6');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSettings(true);
    try {
      await onUpdateSettings({
        currency,
        language,
        weekStartMonday,
        categoryColors: {
          'Appointment': appointmentColor,
          'Work': workColor,
          'Personal': personalColor,
          'Other': otherColor,
        }
      });
      addToast('success', t('settings.successSettingsUpdated'));
    } catch (e) {
      console.error(e);
      addToast('error', t('settings.errorSettingsUpdate'));
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast('error', t('settings.errorDisplayNameEmpty'));
      return;
    }

    setLoadingProfile(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName });
        // Trigger save to user profile document in users collection as well (handled in main App or here)
        addToast('success', t('settings.successProfileUpdated'));
      }
    } catch (e: any) {
      addToast('error', e.message || t('settings.errorProfileUpdate'));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      addToast('error', t('settings.errorPasswordFieldsRequired'));
      return;
    }
    if (newPassword.length < 6) {
      addToast('error', t('settings.errorNewPasswordLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', t('settings.errorPasswordsMismatch'));
      return;
    }

    setLoadingPassword(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        addToast('success', t('settings.successPasswordUpdated'));
        setNewPassword('');
        setConfirmPassword('');
      } else {
        addToast('error', t('settings.errorNoSession'));
      }
    } catch (e: any) {
      console.error(e);
      let errMsg = t('settings.errorPasswordUpdate');
      if (e.code === 'auth/requires-recent-login') {
        errMsg = t('settings.errorRequiresRecentLogin');
      }
      addToast('error', errMsg);
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: General Preference and Colors */}
        <div className="space-y-6">
          {/* Preferences Settings Block */}
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-3 border-b border-slate-200">
              <Globe className="w-4 h-4 text-indigo-600" /> {t('settings.regionalDefaults')}
            </h3>

            <div className="space-y-4">
              {/* Language Dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  {t('settings.interfaceLanguage')}
                </label>
                <div className="mt-1.5">
                  <LanguageSelect value={language} onChange={setLanguage} />
                </div>
              </div>

              {/* Currency Dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  {t('settings.defaultCurrency')}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-xs transition-all"
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.name} ({curr.symbol} - {curr.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start of Week Option */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  {t('settings.weekStart')}
                </label>
                <div className="mt-2.5 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="weekStart"
                      checked={weekStartMonday}
                      onChange={() => setWeekStartMonday(true)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">{t('settings.monday')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="weekStart"
                      checked={!weekStartMonday}
                      onChange={() => setWeekStartMonday(false)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">{t('settings.sunday')}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Custom Category Marker Colors */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" /> {t('settings.categoryColorsTitle')}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('taskModal.categoryAppointment')}</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1.5 shadow-xs bg-slate-50">
                    <input
                      type="color"
                      value={appointmentColor}
                      onChange={(e) => setAppointmentColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">{appointmentColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('taskModal.categoryWork')}</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1.5 shadow-xs bg-slate-50">
                    <input
                      type="color"
                      value={workColor}
                      onChange={(e) => setWorkColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">{workColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('taskModal.categoryPersonal')}</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1.5 shadow-xs bg-slate-50">
                    <input
                      type="color"
                      value={personalColor}
                      onChange={(e) => setPersonalColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">{personalColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('taskModal.categoryOther')}</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1.5 shadow-xs bg-slate-50">
                    <input
                      type="color"
                      value={otherColor}
                      onChange={(e) => setOtherColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">{otherColor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={loadingSettings}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loadingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> {t('settings.savePreferences')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Account and Passwords */}
        <div className="space-y-6">
          {/* Identity Block */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" /> {t('settings.accountIdentity')}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('settings.emailAddress')}</span>
                <span className="text-xs font-bold text-slate-800 break-all">{userProfile.email}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('settings.assignedRole')}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase font-mono mt-0.5">
                  {userProfile.role === 'admin' ? t('common.roleAdmin') : t('common.roleUser')}
                </span>
              </div>
            </div>
          </div>

          {/* Password Change Block */}
          <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-3 border-b border-slate-200">
              <Lock className="w-4 h-4 text-rose-600" /> {t('settings.changeCredentials')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  {t('settings.newPassword')}
                </label>
                <div className="mt-1 relative rounded-lg shadow-xs">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block w-full pr-10 pl-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  {t('settings.confirmNewPassword')}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-xs transition-all"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={loadingPassword}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loadingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> {t('settings.updatePassword')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
