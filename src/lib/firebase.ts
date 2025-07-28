
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from '@firebase/app-check';

// SIMPLIFIED CONFIGURATION:
// The Firebase client will use the same API key as Google Maps.
// This is a valid configuration that reduces the number of keys to manage.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, // Use the Maps API key here
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
let appCheck: AppCheck | undefined;
export let firebaseInitializationError: string | null = null;

console.log("[Firebase Client] Starting initialization...");

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  firebaseInitializationError = "CRITICAL ERROR: Firebase client-side configuration is missing. Please ensure all required NEXT_PUBLIC_ variables are set in your .env.local file (especially NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID) and that you have restarted the development server. The application cannot connect to Firebase.";
  console.error(`[Firebase Client] ${firebaseInitializationError}`);
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
} else {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);
    auth = getAuth(app);
    
    // Set session persistence to avoid unexpected Passkey/WebAuthn prompts and fix redirect loops
    setPersistence(auth, browserSessionPersistence);

    db = getFirestore(app, 'kamperhubv2');
    
    console.log(`[Firebase Client] Successfully initialized for project: ${firebaseConfig.projectId}, connecting to database 'kamperhubv2'.`);

    if (typeof window !== 'undefined') {
      console.log('[Firebase Client] Attempting to enable offline persistence...');
      enableIndexedDbPersistence(db)
        .then(() => console.log('[Firebase Client] Firestore offline persistence enabled.'))
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('[Firebase Client] Firestore offline persistence could not be enabled. This can happen if you have multiple tabs open. Please close other tabs and refresh.');
          } else if (err.code === 'unimplemented') {
            console.warn('[Firebase Client] Firestore offline persistence is not available in this browser. The app will work, but data will not be available offline.');
          } else {
              console.error("[Firebase Client] Error enabling Firestore offline persistence:", err);
          }
        });
    }
  } catch (e: any) {
    firebaseInitializationError = `Firebase failed to initialize. Please check your Firebase project configuration and API keys. Error: ${e.message}`;
    console.error(`[Firebase Client] ${firebaseInitializationError}`, e);
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
  }
}

/**
 * Initializes Firebase App Check on the client side.
 * This function is designed to be called from a useEffect hook in a top-level component
 * to ensure the DOM is ready, preventing reCAPTCHA placeholder errors.
 * It prioritizes the debug token for local development.
 */
export function initializeFirebaseAppCheck() {
  if (typeof window !== 'undefined' && app?.name && !appCheck) {
    // For local development, prioritize the debug token if it exists.
    if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
      console.log('[Firebase Client] App Check: Using debug token for local development.');
      // Make the debug token available globally for Firebase to pick up.
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
    }

    // Initialize with reCAPTCHA Enterprise provider if the key is available.
    // The SDK will automatically use the debug token if window.FIREBASE_APPCHECK_DEBUG_TOKEN is set.
    if (process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY) {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY),
          isTokenAutoRefreshEnabled: true
        });
        console.log('[Firebase Client] App Check initialized with reCAPTCHA Enterprise provider.');
      } catch(e: any) {
        console.error(`[Firebase Client] App Check initialization failed. Error: ${e.message}`);
      }
    } else {
      console.warn('[Firebase Client] App Check not initialized: NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY is not set.');
    }
  }
}

export { app, auth, db };
