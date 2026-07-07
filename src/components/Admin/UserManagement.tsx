/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, IUserService } from '../../types';
import { FirebaseUserService } from '../../services/db';
import { Users, UserPlus, Shield, Trash2, ArrowRightLeft, User, Mail, Search, RefreshCw, Loader2 } from 'lucide-react';
import { UserListSkeleton } from '../UI/Skeleton';
import { useLanguage } from '../../i18n/LanguageContext';

interface UserManagementProps {
  currentUserProfile: UserProfile;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUserProfile,
  addToast,
}) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // User creation form
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [creating, setCreating] = useState(false);

  const userService: IUserService = new FirebaseUserService();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await userService.getAllUsers();
      // Sort users: admins first, then by display name
      const sorted = allUsers.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.displayName.localeCompare(b.displayName);
      });
      setUsers(sorted);
    } catch (e) {
      console.error(e);
      addToast('error', t('admin.errorFetchUsers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserProfile.role === 'admin') {
      fetchUsers();
    }
  }, [currentUserProfile]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) {
      addToast('error', t('admin.errorAllFieldsRequired'));
      return;
    }

    setCreating(true);
    try {
      const newUser = await userService.createUser(email, role, displayName);
      addToast('success', t('admin.successUserCreated', { name: newUser.displayName }));
      setEmail('');
      setDisplayName('');
      setRole('user');
      await fetchUsers(); // reload list
    } catch (e) {
      console.error(e);
      addToast('error', t('admin.errorCreateUser'));
    } finally {
      setCreating(false);
    }
  };

  const roleLabel = (r: UserRole): string => (r === 'admin' ? t('common.roleAdmin') : t('common.roleUser'));

  const handleToggleRole = async (targetUser: UserProfile) => {
    if (targetUser.uid === currentUserProfile.uid) {
      addToast('error', t('admin.errorCannotModifySelf'));
      return;
    }

    const newRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = t('admin.confirmToggleRole', { name: targetUser.displayName, role: newRole.toUpperCase() });

    if (confirm(confirmMsg)) {
      try {
        await userService.updateUserRole(targetUser.uid, newRole);
        addToast('success', t('admin.successRoleUpdated', { name: targetUser.displayName }));
        await fetchUsers();
      } catch (e) {
        addToast('error', t('admin.errorRoleUpdate'));
      }
    }
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (targetUser.uid === currentUserProfile.uid) {
      addToast('error', t('admin.errorCannotDeleteSelf'));
      return;
    }

    const confirmMsg = t('admin.confirmDeleteUser', { name: targetUser.displayName });

    if (confirm(confirmMsg)) {
      try {
        await userService.deleteUser(targetUser.uid);
        addToast('success', t('admin.successUserDeleted', { name: targetUser.displayName }));
        await fetchUsers();
      } catch (e) {
        addToast('error', t('admin.errorDeleteUser'));
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    );
  });

  if (currentUserProfile.role !== 'admin') {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-lg flex items-center gap-4 max-w-2xl shadow-sm">
        <Shield className="w-8 h-8 text-rose-600 shrink-0" />
        <div>
          <h4 className="text-md font-bold uppercase tracking-wider">{t('admin.accessDeniedTitle')}</h4>
          <p className="text-sm mt-1">{t('admin.accessDeniedMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> {t('admin.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t('admin.subtitle')}</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('admin.reloadRegistry')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List Block */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col min-h-[450px]">
          {/* List Controls */}
          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder={t('admin.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-xs transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <UserListSkeleton />
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                <p className="text-sm font-semibold">{t('admin.noUsersFound')}</p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.uid === currentUserProfile.uid;
                return (
                  <div
                    key={user.uid}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0 border border-slate-200">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 truncate text-sm">{user.displayName}</p>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[9px] font-bold">
                              {t('admin.you')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate font-mono mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {/* Role Indicator Badge */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        user.role === 'admin'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {roleLabel(user.role)}
                      </span>

                      {/* Admin Controls */}
                      {!isSelf && (
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                          <button
                            onClick={() => handleToggleRole(user)}
                            className="p-1.5 hover:bg-slate-50 rounded text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            title={t('admin.toggleRoleTitle')}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <div className="h-3.5 w-[1px] bg-slate-200" />
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title={t('admin.deleteUserTitle')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Create User Form Block */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-200 flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-indigo-600" /> {t('admin.registerUser')}
          </h3>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('auth.displayName')}</label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={t('auth.displayNamePlaceholder')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('auth.emailAddress')}</label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('admin.assignedRole')}</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-xs"
                >
                  <option value="user">{t('admin.roleUser')}</option>
                  <option value="admin">{t('admin.roleAdmin')}</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full inline-flex justify-center items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4.5 h-4.5" /> {t('admin.registerProfile')}
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
