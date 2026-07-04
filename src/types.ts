/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (start time)
  endTime?: string; // HH:MM (end time; set for Work shifts)
  shiftId?: string; // id of the WorkShift used (Work category); colors the task
  hasCost: boolean;
  cost?: number;
  currency: string; // e.g., 'EUR', 'USD', 'PEN', 'MAD'
  completed: boolean;
  category: string; // 'Appointment' | 'Work' | 'Personal' | 'Other'
  createdAt: number;
}

// User-defined work shift (Lavoro), managed in Settings
export interface WorkShift {
  id: string;
  name: string;
  start: string; // HH:MM
  end: string; // HH:MM
  color: string; // hex color used for tasks created with this shift
}

export interface AppSettings {
  userId: string;
  currency: string; // 'EUR', 'USD', 'PEN', 'MAD', 'GBP', 'JPY'
  language: string; // ISO 639-1 code, e.g. 'en', 'es', 'fr'
  weekStartMonday: boolean;
  categoryColors: Record<string, string>;
  workShifts: WorkShift[];
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateToEUR: number; // For aggregate analytics KPIs in a single currency (EUR)
}

// Solid Design Abstractions
export interface IAuthService {
  getCurrentUser(): Promise<UserProfile | null>;
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void;
  signOut(): Promise<void>;
}

export interface ITaskService {
  getTasks(userId: string): Promise<Task[]>;
  addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<void>;
  deleteTask(id: string): Promise<void>;
}

export interface ISettingsService {
  getSettings(userId: string): Promise<AppSettings>;
  updateSettings(userId: string, updates: Partial<AppSettings>): Promise<void>;
}

export interface IUserService {
  getAllUsers(): Promise<UserProfile[]>;
  createUser(email: string, role: UserRole, displayName: string): Promise<UserProfile>;
  updateUserRole(uid: string, role: UserRole): Promise<void>;
  deleteUser(uid: string): Promise<void>;
}
