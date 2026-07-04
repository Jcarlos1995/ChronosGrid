/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FirebaseAuthService, 
  FirebaseTaskService, 
  FirebaseSettingsService 
} from './services/db';
import { UserProfile, Task, AppSettings } from './types';
import { AuthScreen } from './components/Auth/AuthScreen';
import { CalendarGrid } from './components/Calendar/CalendarGrid';
import { TaskModal } from './components/Calendar/TaskModal';
import { DashboardView } from './components/Dashboard/DashboardView';
import { SettingsView } from './components/Settings/SettingsView';
import { UserManagement } from './components/Admin/UserManagement';
import { DesktopAppView } from './components/Desktop/DesktopAppView';
import { UpdateAlert } from './components/Desktop/UpdateAlert';
import { useDesktopUpdater } from './hooks/useDesktopUpdater';
import { ToastContainer, ToastMessage } from './components/UI/Toast';
import {
  Calendar,
  BarChart,
  Settings as SettingsIcon,
  Users,
  LogOut,
  CalendarDays,
  Menu,
  X,
  User,
  Loader2,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage, LanguageCode } from './i18n/LanguageContext';

type TabType = 'calendar' | 'dashboard' | 'settings' | 'desktop' | 'users';

export default function App() {
  const { t, language, setLanguage } = useLanguage();
  const { status: updateStatus, installNow } = useDesktopUpdater();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  
  // Modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Responsive mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Service Instances
  const authService = React.useMemo(() => new FirebaseAuthService(), []);
  const taskService = React.useMemo(() => new FirebaseTaskService(), []);
  const settingsService = React.useMemo(() => new FirebaseSettingsService(), []);

  // Helper to add toast notification
  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (userProfile) => {
      setUser(userProfile);
      setAuthChecked(true);
      if (!userProfile) {
        setTasks([]);
        setSettings(null);
      }
    });
    return () => unsubscribe();
  }, [authService]);

  // Load User Data (Tasks + Settings)
  const fetchUserData = async (userId: string) => {
    setLoadingData(true);
    try {
      const fetchedSettings = await settingsService.getSettings(userId);
      setSettings(fetchedSettings);

      try {
        const fetchedTasks = await taskService.getTasks(userId);
        setTasks(fetchedTasks);
      } catch (err) {
        console.warn("Index building, querying un-ordered fallback:", err);
        const fetchedTasks = await taskService.getTasksFallback(userId);
        setTasks(fetchedTasks);
      }
    } catch (e) {
      console.error('Error fetching user data:', e);
      addToast('error', t('app.errorSyncData'));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData(user.uid);
    }
  }, [user]);

  // Sync the interface language with the user's saved preference once settings load
  useEffect(() => {
    if (settings?.language && settings.language !== language) {
      setLanguage(settings.language as LanguageCode);
    }
  }, [settings]);

  // Task operation callbacks
  const handleAddTask = async (taskInput: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask = await taskService.addTask(taskInput);
    setTasks((prev) => [...prev, newTask]);
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    await taskService.updateTask(id, updates);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteTask = async (id: string) => {
    await taskService.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Settings update callback
  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    if (user) {
      await settingsService.updateSettings(user.uid, updates);
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  // Logout callback
  const handleLogout = async () => {
    try {
      await authService.signOut();
      addToast('success', t('app.successLogout'));
    } catch (e) {
      addToast('error', t('app.errorLogout'));
    }
  };

  // Grid Cell / Day interaction
  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setModalOpen(true);
  };

  const handleQuickAddTask = (dateStr: string) => {
    setSelectedDate(dateStr);
    setModalOpen(true);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" />
        <p className="text-sm font-semibold text-slate-500 font-mono">{t('app.initializing')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen onAuthSuccess={() => {}} addToast={addToast} />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  // Navigation Items
  const navItems = [
    { id: 'calendar', label: t('app.navCalendar'), icon: CalendarDays },
    { id: 'dashboard', label: t('app.navDashboard'), icon: BarChart },
    { id: 'settings', label: t('app.navSettings'), icon: SettingsIcon },
    { id: 'desktop', label: t('app.navDesktop'), icon: Monitor },
  ];

  if (user.role === 'admin') {
    navItems.push({ id: 'users', label: t('app.navAdmin'), icon: Users });
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row font-sans overflow-x-hidden">
      {/* Toast Notification Mount */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Sidebar Navigation (Desktop only) */}
      <aside className="w-64 bg-slate-900 hidden md:flex flex-col border-r border-slate-800 shrink-0 select-none">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-white text-xl font-bold tracking-tight uppercase">
            Chronos<span className="text-indigo-400">Grid</span>
          </h1>
          <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-semibold italic">{t('app.designSystem')}</p>
        </div>
        
        <nav className="flex-1 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center px-6 py-3.5 transition-all text-left border-l-4 font-medium text-sm cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-indigo-500'
                    : 'text-slate-300 hover:bg-slate-800/60 border-l-4 border-transparent hover:text-white'
                }`}
              >
                <div className={`w-5 h-5 mr-3 rounded-sm flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <UpdateAlert status={updateStatus} onInstall={installNow} />

          <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl mb-4">
            <p className="text-[10px] text-indigo-400 font-bold mb-1 uppercase tracking-widest">
              {t('app.roleLabel', { role: (user.role === 'admin' ? t('common.roleAdmin') : t('common.roleUser')).toUpperCase() })}
            </p>
            <p className="text-[11px] text-slate-300 truncate font-medium">{t('app.loggedInAs', { name: user.displayName })}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-700"
            title={t('app.logOutTitle')}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('app.logOut')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (Mobile only) */}
      <header className="md:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <h1 className="text-white text-lg font-bold tracking-tight uppercase">
            Chronos<span className="text-indigo-400">Grid</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700"
            title={t('app.logOutTitle')}
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl cursor-pointer border border-slate-700"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-slate-900 border-b border-slate-800 shadow-xl px-4 py-3 space-y-1.5 z-25 absolute w-full top-[61px] left-0"
          >
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl mb-2 border border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white uppercase text-sm">
                {user.displayName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">{user.displayName}</p>
                <p className="text-xs text-slate-400 mt-1 font-mono">{user.email}</p>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-h-screen">
        {/* Top Header Bar (Desktop only) */}
        <header className="h-16 bg-white border-b border-slate-200 hidden md:flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-md font-bold uppercase tracking-wider text-slate-500">
              {activeTab === 'calendar' && t('app.headerCalendar')}
              {activeTab === 'dashboard' && t('app.headerDashboard')}
              {activeTab === 'settings' && t('app.headerSettings')}
              {activeTab === 'desktop' && t('app.headerDesktop')}
              {activeTab === 'users' && t('app.headerAdmin')}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2.5 text-right">
              <div>
                <p className="text-sm font-bold text-slate-800 leading-tight">{user.displayName}</p>
                <span className="inline-flex px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase bg-slate-100 border border-slate-200 text-slate-600 rounded mt-0.5">
                  {user.role}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200 uppercase tracking-wider">
                {user.displayName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Core Body Container */}
        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {loadingData && (
            <div className="mb-4 bg-indigo-50/50 border border-indigo-100 text-indigo-700 px-4 py-3 rounded-xl text-xs font-semibold font-mono flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('app.synchronizing')}
            </div>
          )}

          <div className="h-full min-h-[500px]">
            {activeTab === 'calendar' && settings && (
              <div className="grid grid-cols-1 gap-6 h-full">
                <CalendarGrid
                  tasks={tasks}
                  settings={settings}
                  onDayClick={handleDayClick}
                  onAddTaskClick={handleQuickAddTask}
                  selectedDate={selectedDate}
                />
              </div>
            )}

            {activeTab === 'dashboard' && settings && (
              <DashboardView
                tasks={tasks}
                settings={settings}
                addToast={addToast}
              />
            )}

            {activeTab === 'settings' && settings && (
              <SettingsView
                userProfile={user}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                addToast={addToast}
              />
            )}

            {activeTab === 'desktop' && <DesktopAppView />}

            {activeTab === 'users' && (
              <UserManagement
                currentUserProfile={user}
                addToast={addToast}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modal overlays — rendered conditionally (not via AnimatePresence) so it
          always unmounts reliably on close; the enter animation lives on the
          modal's inner motion.div. */}
      {modalOpen && selectedDate && settings && (
        <TaskModal
          dateStr={selectedDate}
          tasks={tasks}
          settings={settings}
          onClose={() => {
            setModalOpen(false);
            setSelectedDate(null);
          }}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          addToast={addToast}
        />
      )}
    </div>
  );
}
