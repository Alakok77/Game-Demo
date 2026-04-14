import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Helper to validate environment variables (prevent literal "undefined" strings)
const isValid = (v: any) => v && v !== "undefined" && v !== "null" && v !== "";

// We only attempt to initialize if we have the critical bits: Project ID and Database URL
const isConfigValid = isValid(firebaseConfig.projectId) && isValid(firebaseConfig.databaseURL);
const isBrowser = typeof window !== "undefined";

let app = null;

// Only initialize on the client-side OR if we have valid config on the server
// Prerendering (build-time) usually has isBrowser = false and missing config
if (isBrowser || isConfigValid) {
  try {
    if (getApps().length > 0) {
      app = getApp();
    } else if (isConfigValid) {
      app = initializeApp(firebaseConfig);
    } else {
      console.error("Firebase Debug: Config invalid or missing.", {
        hasProjectId: !!firebaseConfig.projectId,
        hasDatabaseURL: !!firebaseConfig.databaseURL,
        isBrowser
      });
    }
  } catch (err) {
    console.error("Firebase Init Error:", err);
  }
} else {
  console.warn("Firebase Skip: Not in browser and config invalid.");
}

// Export db instance. During build time if config is missing, this will be null.
// Use 'as any' to satisfy Firebase's function types in gameStore.ts imports.
export const db = app ? getDatabase(app) : (null as any);
