/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  updatePassword as fbUpdatePassword,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  UserProfile,
  Task,
  AppSettings,
  IAuthService,
  ITaskService,
  ISettingsService,
  IUserService,
  UserRole
} from '../types';
import { getStoredLanguage } from '../i18n/translations';

// Constants
const USERS_COLLECTION = 'users';
const TASKS_COLLECTION = 'tasks';
const SETTINGS_COLLECTION = 'settings';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class FirebaseAuthService implements IAuthService {
  async getCurrentUser(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return this.getUserProfile(user.uid);
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    return fbOnAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        callback(null);
        return;
      }
      try {
        const profile = await this.getUserProfile(fbUser.uid);
        if (profile) {
          callback(profile);
        } else {
          // If no profile exists yet (e.g. edge case), create a default one
          const defaultProfile = await this.createUserProfile(fbUser.uid, fbUser.email || '', 'User');
          callback(defaultProfile);
        }
      } catch (e) {
        console.error('Error in auth state change profile fetch:', e);
        callback(null);
      }
    });
  }

  async signOut(): Promise<void> {
    await fbSignOut(auth);
  }

  // Helper to fetch user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, USERS_COLLECTION, uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `${USERS_COLLECTION}/${uid}`);
    }
  }

  // Helper to create profile
  async createUserProfile(uid: string, email: string, displayName: string, role?: UserRole): Promise<UserProfile> {
    // Determine role: if this is the first user in the collection, make them admin
    let assignedRole: UserRole = role || 'user';
    
    try {
      const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
      if (usersSnap.empty) {
        assignedRole = 'admin'; // First user is automatically admin
      }
    } catch (e) {
      console.warn('Could not query users count, defaulting to user role:', e);
    }

    const profile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      role: assignedRole,
      createdAt: Date.now(),
    };

    try {
      await setDoc(doc(db, USERS_COLLECTION, uid), profile);
      return profile;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `${USERS_COLLECTION}/${uid}`);
    }
  }
}

export class FirebaseTaskService implements ITaskService {
  async getTasks(userId: string): Promise<Task[]> {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('time', 'asc')
    );
    try {
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      return tasks;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, TASKS_COLLECTION);
    }
  }

  // In case the orderBy fails because of missing indexes, fallback to un-ordered query and sort in memory
  async getTasksFallback(userId: string): Promise<Task[]> {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId)
    );
    try {
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      // Sort in-memory by time
      return tasks.sort((a, b) => a.time.localeCompare(b.time));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, TASKS_COLLECTION);
    }
  }

  async addTask(taskInput: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const newDocRef = doc(collection(db, TASKS_COLLECTION));
    const task: Task = {
      ...taskInput,
      id: newDocRef.id,
      createdAt: Date.now(),
    };
    try {
      await setDoc(newDocRef, task);
      return task;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `${TASKS_COLLECTION}/${newDocRef.id}`);
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    try {
      await updateDoc(docRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${TASKS_COLLECTION}/${id}`);
    }
  }

  async deleteTask(id: string): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    try {
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${TASKS_COLLECTION}/${id}`);
    }
  }
}

export class FirebaseSettingsService implements ISettingsService {
  private defaultSettings(userId: string): AppSettings {
    return {
      userId,
      currency: 'EUR',
      language: getStoredLanguage(),
      weekStartMonday: true,
      categoryColors: {
        'Appointment': '#3b82f6', // blue
        'Work': '#ef4444',        // red
        'Personal': '#10b981',    // green
        'Other': '#8b5cf6'        // purple
      }
    };
  }

  async getSettings(userId: string): Promise<AppSettings> {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    let docSnap;
    try {
      docSnap = await getDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `${SETTINGS_COLLECTION}/${userId}`);
    }

    if (docSnap.exists()) {
      return {
        ...this.defaultSettings(userId),
        ...docSnap.data()
      } as AppSettings;
    }
    // Return default settings and save them
    const defaults = this.defaultSettings(userId);
    try {
      await setDoc(docRef, defaults);
      return defaults;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `${SETTINGS_COLLECTION}/${userId}`);
    }
  }

  async updateSettings(userId: string, updates: Partial<AppSettings>): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    try {
      await setDoc(docRef, updates, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${SETTINGS_COLLECTION}/${userId}`);
    }
  }
}

export class FirebaseUserService implements IUserService {
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
      const users: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
      });
      return users;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, USERS_COLLECTION);
    }
  }

  async createUser(email: string, role: UserRole, displayName: string): Promise<UserProfile> {
    const uid = 'user_created_' + Math.random().toString(36).substring(2, 9);
    const profile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      role,
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(db, USERS_COLLECTION, uid), profile);
      return profile;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `${USERS_COLLECTION}/${uid}`);
    }
  }

  async updateUserRole(uid: string, role: UserRole): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, uid);
    try {
      await updateDoc(docRef, { role });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
    }
  }

  async deleteUser(uid: string): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, uid);
    try {
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${USERS_COLLECTION}/${uid}`);
    }
  }
}
