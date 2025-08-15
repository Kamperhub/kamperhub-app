// firebase.ts (or wherever your Firebase client-side initialization lives)

import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

// IMPORTANT: All client-side specific Firebase SDKs (like Analytics, Remote Config, App Check)
// should be dynamically imported. This prevents them from being included and executed
// during Next.js's server-side build process, which can cause 'n.registerVersion' errors.

// Declare global for App Check Debug Token (Crucial for localhost testing)
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

// All Firebase instances are now initialized to null, and typed as potentially null
// These will remain null on the server, and be populated on the client.
let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let analytics: import('firebase/analytics').Analytics | null = null; // Type imported dynamically
export let remoteConfig: import('firebase/remote-config').RemoteConfig | null = null; // Type imported dynamically
export let appCheck: import('firebase/app-check').AppCheck | undefined; // Type imported dynamically

// NEW EXPORTS for Remote Config functions
export let fetchAndActivateRC: typeof import('firebase/remote-config')['fetchAndActivate'] | null = null;
export let getStringRC: typeof import('firebase/remote-config')['getString'] | null = null;
export let getAllRC: typeof import('firebase/remote-config')['getAll'] | null = null;


export let firebaseInitializationError: string | null = null;

// Declare placeholders for dynamically imported functions
let initializeAppCheckFunc: typeof import('firebase/app-check')['initializeAppCheck'] | undefined;
let ReCaptchaEnterpriseProviderClass: typeof import('firebase/app-check')['ReCaptchaEnterpriseProvider'] | undefined;
let getAnalyticsFunc: typeof import('firebase/analytics')['getAnalytics'] | undefined;
let getRemoteConfigFunc: typeof import('firebase/remote-config')['getRemoteConfig'] | undefined;
// NEW placeholders for Remote Config functions
let fetchAndActivateRemoteConfigFunc: typeof import('firebase/remote-config')['fetchAndActivate'] | undefined;
let getStringRemoteConfigFunc: typeof import('firebase/remote-config')['getString'] | undefined;
let getAllRemoteConfigFunc: typeof import('firebase/remote-config')['getAll'] | undefined;


console.log("[Firebase Client] Starting initialization...");

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  firebaseInitializationError = "CRITICAL ERROR: Firebase client-side configuration is missing. Please ensure all required NEXT_PUBLIC_FIREBASE_ variables are set in your .env.local file (especially NEXT_PUBLIC_FIREBASE_API_KEY) and that you have restarted the development server. The application cannot connect to Firebase.";
  console.error(`[Firebase Client] ${firebaseInitializationError}`);
  // No assignments to app, auth, db here; they remain null as per their initial declaration
} else {
  try {
    // DEBUG LOG: Display the firebaseConfig object being used
    console.log("DEBUG_RUNTIME_FIREBASE_CONFIG: ", firebaseConfig);

    // KEY CHANGE: All Firebase client SDK initialization happens ONLY if in a browser environment
    if (typeof window !== 'undefined') {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);

      // DEBUG LOG: Display information about the initialized Firebase app instance
      console.log("DEBUG_RUNTIME_FIREBASE_APP_INSTANCE:", app.name, app.options.projectId);

      // Auth and Firestore can generally be imported directly as they are core services
      // that don't typically run into the same 'registerVersion' issues as services
      // that might have more immediate side effects on import.
      auth = getAuth(app);
      setPersistence(auth, browserSessionPersistence);

      db = getFirestore(app);

      // Dynamic imports for Analytics, Remote Config, and App Check
      // These services have specific browser dependencies or behaviors that
      // are best loaded only in the client environment.
      Promise.all([
        import('firebase/analytics').then(m => {
          getAnalyticsFunc = m.getAnalytics;
          console.log('[Firebase Client] Firebase Analytics module loaded dynamically.');
        }),
        import('firebase/remote-config').then(m => {
          getRemoteConfigFunc = m.getRemoteConfig;
          fetchAndActivateRemoteConfigFunc = m.fetchAndActivate; // NEW
          getStringRemoteConfigFunc = m.getString;                 // NEW
          getAllRemoteConfigFunc = m.getAll;                     // NEW
          console.log('[Firebase Client] Firebase Remote Config module loaded dynamically.');
        }),
        import('firebase/app-check').then(m => {
          initializeAppCheckFunc = m.initializeAppCheck;
          ReCaptchaEnterpriseProviderClass = m.ReCaptchaEnterpriseProvider;
          console.log('[Firebase Client] Firebase App Check module loaded dynamically.');
        }),
      ]).then(() => {
        // Assign the dynamically loaded services to our exported variables
        if (app && getAnalyticsFunc) {
          analytics = getAnalyticsFunc(app);
          console.log('[Firebase Client] Analytics service initialized.');
        }
        if (app && getRemoteConfigFunc && fetchAndActivateRemoteConfigFunc && getStringRemoteConfigFunc && getAllRemoteConfigFunc) {
          remoteConfig = getRemoteConfigFunc(app);
          fetchAndActivateRC = fetchAndActivateRemoteConfigFunc; // NEW
          getStringRC = getStringRemoteConfigFunc;                 // NEW
          getAllRC = getAllRemoteConfigFunc;                     // NEW

          if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
            // Ensure remoteConfig is not null before accessing its properties
            if (remoteConfig) remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour for dev
          }
          console.log('[Firebase Client] Remote Config service initialized.');
        }
        // App Check initialization is handled by initializeFirebaseAppCheck() separately
      }).catch(importError => {
        console.error('[Firebase Client] Error loading dynamic Firebase services:', importError);
      });

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
    // If an error occurs during initialization, ensure all are null
    app = null;
    auth = null;
    db = null;
    analytics = null;
    remoteConfig = null;
    appCheck = undefined;
    fetchAndActivateRC = null; // NEW
    getStringRC = null;         // NEW
    getAllRC = null;            // NEW
  }
}

export function initializeFirebaseAppCheck() {
  // Only attempt to initialize App Check if in browser AND dynamic imports have completed successfully
  // Also ensure 'app' is initialized and available
  if (typeof window !== 'undefined' && app && initializeAppCheckFunc && ReCaptchaEnterpriseProviderClass) {
    if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
      console.log('[Firebase Client] App Check: Using debug token for local development.');
      // Convert string env var to boolean for debug token (if you set it as 'true'/'false' in .env)
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN === 'true';
    }

    if (process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY) {
      try {
        appCheck = initializeAppCheckFunc(app, {
          provider: new ReCaptchaEnterpriseProviderClass(process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY),
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

// Export the core app, auth, and db instances.
// Other services (analytics, remoteConfig, appCheck) are already exported as `export let ...` and will be null/undefined on server.
// Remote Config functions (fetchAndActivateRC, getStringRC, getAllRC) are also exported.
export { app };
