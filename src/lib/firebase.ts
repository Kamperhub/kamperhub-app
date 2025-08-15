import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
// Removed: import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getRemoteConfig, type RemoteConfig } from "firebase/remote-config";


// --- Declare global for App Check Debug Token (Crucial for localhost testing) ---
declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: string | boolean | undefined;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// KEY CHANGE: All Firebase instances are now initialized to null, and typed as potentially null
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let remoteConfig: RemoteConfig | null = null;
let appCheck: import('firebase/app-check').AppCheck | undefined; // Use import type for AppCheck here

export let firebaseInitializationError: string | null = null;

// Declare functions for App Check, will be assigned dynamically
let initializeAppCheckFunc: typeof import('firebase/app-check')['initializeAppCheck'] | undefined;
let ReCaptchaEnterpriseProviderClass: typeof import('firebase/app-check')['ReCaptchaEnterpriseProvider'] | undefined;
// Also declare the AppCheck type from firebase/app-check, as it's no longer directly imported
type AppCheckType = import('firebase/app-check').AppCheck;


console.log("[Firebase Client] Starting initialization...");

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  firebaseInitializationError = "CRITICAL ERROR: Firebase client-side configuration is missing. Please ensure all required NEXT_PUBLIC_FIREBASE_ variables are set in your .env.local file (especially NEXT_PUBLIC_FIREBASE_API_KEY) and that you have restarted the development server. The application cannot connect to Firebase.";
  console.error(`[Firebase Client] ${firebaseInitializationError}`);
  // KEY CHANGE: No assignments to app, auth, db here; they remain null as per their initial declaration
} else {
  try {
    // DEBUG LOG: Display the firebaseConfig object being used
    console.log("DEBUG_RUNTIME_FIREBASE_CONFIG: ", firebaseConfig);

    // KEY CHANGE: All Firebase client SDK initialization happens ONLY if in a browser environment
    if (typeof window !== 'undefined') {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);

      // DEBUG LOG: Display information about the initialized Firebase app instance
      console.log("DEBUG_RUNTIME_FIREBASE_APP_INSTANCE:", app.name, app.options.projectId);

      auth = getAuth(app);
      setPersistence(auth, browserSessionPersistence); // This is now safely inside

      db = getFirestore(app);
      analytics = getAnalytics(app);
      remoteConfig = getRemoteConfig(app);
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        // Ensure remoteConfig is not null before accessing its properties
        if (remoteConfig) remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour for dev
      }

      // Dynamic import for App Check and other browser-specific modules
      Promise.all([
        import('firebase/app-check').then(m => {
          initializeAppCheckFunc = m.initializeAppCheck;
          ReCaptchaEnterpriseProviderClass = m.ReCaptchaEnterpriseProvider;
        }),
      ]).catch(console.error); // Catch any errors during dynamic import

      // Firestore persistence
      // Ensure db is not null before enabling persistence
      if (db) {
        enableIndexedDbPersistence(db)
          .then(() => console.log('[Firebase Client] Firestore offline persistence enabled.'))
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.warn('[Firebase Client] Firestore offline persistence could not be enabled. This can happen if you have multiple tabs open.');
            } else if (err.code === 'unimplemented') {
              console.warn('[Firebase Client] Firestore offline persistence is not available in this browser.');
            } else {
                  console.error("[Firebase Client] Error enabling Firestore offline persistence:", err);
            }
          });
      }
    }
    // If not in window environment, app, auth, db, analytics, remoteConfig remain null
    // This is safe because server-side code shouldn't be using these client SDK instances.

    console.log(`[Firebase Client] Successfully initialized for project: ${firebaseConfig.projectId}.`);

  } catch (e: any) {
    firebaseInitializationError = `Firebase failed to initialize. Please check your Firebase project configuration and API keys. Error: ${e.message}`;
    console.error(`[Firebase Client] ${firebaseInitializationError}`, e);
    // KEY CHANGE: If an error occurs during initialization, ensure all are null
    app = null;
    auth = null;
    db = null;
    analytics = null;
    remoteConfig = null;
    appCheck = undefined;
  }
}

export function initializeFirebaseAppCheck() {
  // Only attempt to initialize App Check if in browser AND dynamic imports have completed successfully
  // Also ensure 'app' is initialized and available
  if (typeof window !== 'undefined' && app && initializeAppCheckFunc && ReCaptchaEnterpriseProviderClass) {
    if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
      console.log('[Firebase Client] App Check: Using debug token for local development.');
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
    }

    if (process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY) {
      try {
        appCheck = initializeAppCheckFunc(app, {
          provider: new ReCaptchaEnterpriseProviderClass(process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY),
          isTokenAutoRefreshEnabled: true
        }) as AppCheckType;
        console.log('[Firebase Client] App Check initialized with reCAPTCHA Enterprise provider.');
      } catch(e: any) {
        console.error(`[Firebase Client] App Check initialization failed. Error: ${e.message}`);
      }
    } else {
      console.warn('[Firebase Client] App Check not initialized: NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY is not set.');
    }
  }
}

// Export the instances. On the server, these will be null.
export { app, auth, db, analytics, remoteConfig };

