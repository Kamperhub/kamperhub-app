
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

// --- Firebase Configuration ---
// This app is configured to use environment variables.
// Create a .env.local file in the root of your project and add your Firebase project's configuration values there.
// Refer to FIREBASE_SETUP_CHECKLIST.md for the full list and instructions.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
export let firebaseInitializationError: string | null = null;

// Validate that the configuration has been loaded from environment variables
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  firebaseInitializationError = "CRITICAL ERROR: Firebase client-side configuration is missing. Please ensure all NEXT_PUBLIC_FIREBASE_* variables are set in your .env.local file and that you have restarted the development server. The application cannot connect to Firebase.";
  console.error(`[Firebase Client] ${firebaseInitializationError}`);
  // Assign empty objects to prevent downstream hard errors, the UI will show the config error.
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
} else {
  try {
    // Initialize Firebase if config is valid
    app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);
    auth = getAuth(app);
    db = getFirestore(app, 'kamperhubv2');

    console.log(`[Firebase Client] Successfully initialized for project: ${firebaseConfig.projectId}, connecting to database 'kamperhubv2'.`);

    // Initialize other services only on the client-side
    if (typeof window !== 'undefined') {
      try {
        enableIndexedDbPersistence(db)
          .then(() => console.log('[Firebase Client] Firestore offline persistence enabled.'))
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.warn('[Firebase Client] Firestore offline persistence could not be enabled. Multiple tabs open?');
            } else if (err.code === 'unimplemented') {
              console.warn('[Firebase Client] Firestore offline persistence is not available in this browser.');
            }
          });
      } catch (error) {
         console.error("[Firebase Client] CRITICAL: Error enabling Firestore offline persistence:", error);
      }
    }
  } catch (e: any) {
    firebaseInitializationError = `Firebase failed to initialize. Please check your Firebase project configuration and API keys. Error: ${e.message}`;
    console.error(`[Firebase Client] ${firebaseInitializationError}`, e);
    // Assign empty objects to prevent downstream hard errors, the UI will show the config error.
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
  }
}

export { app, auth, db };
