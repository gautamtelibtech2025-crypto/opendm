/** Firebase Admin initialization for Node.js route handlers and workers. */
import { applicationDefault, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function getFirebaseAdminApp(): App {
  if (getApps().length) return getApp();
  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export function getAdminAuth() { return getAuth(getFirebaseAdminApp()); }
export function getAdminFirestore() { return getFirestore(getFirebaseAdminApp()); }
