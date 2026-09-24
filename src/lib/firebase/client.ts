"use client";

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";
import {
  type Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { type FirebaseStorage, getStorage } from "firebase/storage";
import { type Functions, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0]!;
  }
  return initializeApp(firebaseConfig);
}

export const app: FirebaseApp = getFirebaseApp();

/**
 * Explicit long-lived persistence (IndexedDB, falling back to localStorage) so admin
 * and student sessions survive tab closes, reloads and PWA restarts. Firebase keeps
 * the refresh token, so the user only signs in again after an explicit sign-out.
 */
function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") return getAuth(app);
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } catch {
    // Already initialized (hot reload / second import).
    return getAuth(app);
  }
}

export const auth: Auth = getFirebaseAuth();

/**
 * Firestore's own IndexedDB persistence (not the service worker) is what makes the
 * student PWA offline-graceful: a real-time `onSnapshot` listener isn't a cacheable
 * HTTP GET, so the classic SW "network-first" recipe doesn't apply to it the way it
 * does to the catalog/fonts/icons — those ARE plain fetches and are handled by the
 * service worker instead (see public/sw.js).
 */
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app, "us-central1");
