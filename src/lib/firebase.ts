
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAnalytics, type Analytics } from "firebase/analytics";

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
let appCheck: AppCheck | undefined;
let analytics: Analytics | undefined;
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
    db = getFirestore(app);

    console.log(`[Firebase Client] Successfully initialized for project: ${firebaseConfig.projectId}`);

    // Initialize other services only on the client-side
    if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.error("Failed to initialize Firebase Analytics:", error);
      }

      const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY;
      if(reCaptchaKey) {
          try {
            // IMPORTANT: This debug token logic is for local development ONLY.
            // It allows App Check to work without a real reCAPTCHA challenge.
            if (process.env.NODE_ENV === 'development') {
               // The .env.local file should contain: NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN=...
               if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
                  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
                  console.log('[Firebase Client] App Check using debug token from .env.local.');
               } else {
                  console.warn('[Firebase Client] App Check debug mode may be enabled. If you see App Check errors, ensure NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN is set in .env.local and that you have restarted your server. Check the browser console for the required token if one is logged there.');
               }
            }

            appCheck = initializeAppCheck(app, {
              provider: new ReCaptchaEnterpriseProvider(reCaptchaKey),
              isTokenAutoRefreshEnabled: true
            });
            console.log('[Firebase Client] App Check initialized.');

          } catch (error) {
            console.error("[Firebase Client] CRITICAL: Error initializing App Check:", error);
          }
      } else {
        console.warn("[Firebase Client] NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY is not set. App Check will not be initialized.");
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

export { app, auth, db, appCheck, analytics };
