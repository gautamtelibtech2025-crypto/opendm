'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

function config() {
  const required = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw new Error(`Firebase is not configured. Missing: ${missing.join(', ')}`);
  return required as Required<typeof required>;
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(config());
}

export function getFirebaseAuth(): Auth { return getAuth(getFirebaseApp()); }
export function getFirebaseStorage(): FirebaseStorage { return getStorage(getFirebaseApp()); }
export const googleProvider = new GoogleAuthProvider();
