import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

void setPersistence(auth, browserLocalPersistence);

if (
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true"
) {
  const marker = "__geradorcheck_auth_emulator_connected";
  const globalWithMarker = globalThis as typeof globalThis &
    Record<string, unknown>;
  if (!globalWithMarker[marker]) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    globalWithMarker[marker] = true;
  }
}
