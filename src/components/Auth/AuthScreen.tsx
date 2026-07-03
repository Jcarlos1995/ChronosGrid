/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { FirebaseAuthService } from '../../services/db';
import { motion } from 'motion/react';
import { Calendar, Mail, Lock, User, LogIn, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { ToastMessage } from '../UI/Toast';
import { LanguageSelect } from '../UI/LanguageSelect';
import { useLanguage } from '../../i18n/LanguageContext';

interface AuthScreenProps {
  onAuthSuccess: () => void;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, addToast }) => {
  const { t, language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('error', t('auth.errorFillFields'));
      return;
    }
    if (password.length < 6) {
      addToast('error', t('auth.errorPasswordLength'));
      return;
    }

    setLoading(true);
    const authService = new FirebaseAuthService();

    try {
      if (isLogin) {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
        addToast('success', t('auth.successLogin'));
        onAuthSuccess();
      } else {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile in Firestore
        await authService.createUserProfile(
          userCredential.user.uid,
          email,
          displayName || email.split('@')[0]
        );
        addToast('success', t('auth.successSignup'));
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      let errMsg = t('auth.errorGeneric');
      if (error.code === 'auth/email-already-in-use') {
        errMsg = t('auth.errorEmailInUse');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errMsg = t('auth.errorInvalidCredential');
      } else if (error.code === 'auth/invalid-email') {
        errMsg = t('auth.errorInvalidEmail');
      } else if (error.message) {
        errMsg = error.message;
      }
      addToast('error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 w-48">
        <LanguageSelect value={language} onChange={setLanguage} />
      </div>

      <div className="sm:mx-auto w-full max-w-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center"
        >
          <div className="bg-indigo-600 p-3 rounded-lg shadow-md text-white border border-indigo-700">
            <Calendar className="w-10 h-10" />
          </div>
        </motion.div>

        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-950 font-sans">
          {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 uppercase tracking-wider font-semibold">
          {isLogin ? t('auth.signInSubtitle') : t('auth.registerSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-lg sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleAuth}>
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('auth.displayName')}</label>
                <div className="mt-1 relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('auth.displayNamePlaceholder')}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('auth.emailAddress')}</label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('auth.emailPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('auth.password')}</label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  <>
                    {t('auth.signIn')} <LogIn className="ml-2 w-4 h-4" />
                  </>
                ) : (
                  <>
                    {t('auth.register')} <UserPlus className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                <span className="px-2 bg-white text-slate-400">{t('auth.orContinueWith')}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 focus:outline-none transition-colors duration-200 flex items-center gap-1 cursor-pointer"
              >
                {isLogin ? (
                  <>
                    {t('auth.createNewAccount')} <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    {t('auth.alreadyHaveAccount')}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
