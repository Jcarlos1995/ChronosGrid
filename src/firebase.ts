/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQ8c01XHtGJf45xZ3QhAi4EX9-2FjKJBs",
  authDomain: "calendar-caf64.firebaseapp.com",
  projectId: "calendar-caf64",
  storageBucket: "calendar-caf64.firebasestorage.app",
  messagingSenderId: "111067159895",
  appId: "1:111067159895:web:c46e5af40f8a2c37fef212",
  measurementId: "G-QYV66GRKPE"
};

// Idempotent init: reuse the existing app if one was already created (avoids
// duplicate-app errors during hot reload and repeated imports)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Uses the project's default Firestore database
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});
