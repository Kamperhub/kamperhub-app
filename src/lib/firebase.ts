
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from '@firebase/app-check';
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

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;
let remoteConfig: RemoteConfig | null = null;
let appCheck: AppCheck | undefined;
export let firebaseInitializationError: string | null = null;

console.log("[Firebase Client] Starting initialization...");

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  firebaseInitializationError = "CRITICAL ERROR: Firebase client-side configuration is missing. Please ensure all required NEXT_PUBLIC_FIREBASE_ variables are set in your .env.local file (especially NEXT_PUBLIC_FIREBASE_API_KEY) and that you have restarted the development server. The application cannot connect to Firebase.";
  console.error(`[Firebase Client] ${firebaseInitializationError}`);
  // @ts-ignore
  app = {};
  // @ts-ignore
  auth = {};
  // @ts-ignore
  db = {};
} else {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);
    auth = getAuth(app);
    setPersistence(auth, browserSessionPersistence);
    
    // CORRECTED: The client SDK connects to the default Firestore instance for the project.
    db = getFirestore(app);

    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
        remoteConfig = getRemoteConfig(app);
        if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
            remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour for dev
        }
    }
    
    console.log(`[Firebase Client] Successfully initialized for project: ${firebaseConfig.projectId}.`);

    if (typeof window !== 'undefined') {
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
  } catch (e: any) {
    firebaseInitializationError = `Firebase failed to initialize. Please check your Firebase project configuration and API keys. Error: ${e.message}`;
    console.error(`[Firebase Client] ${firebaseInitializationError}`, e);
    // @ts-ignore
    app = {};
    // @ts-ignore
    auth = {};
    // @ts-ignore
    db = {};
  }
}

export function initializeFirebaseAppCheck() {
  if (typeof window !== 'undefined' && app?.name && !appCheck) {
    if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
      console.log('[Firebase Client] App Check: Using debug token for local development.');
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
    }

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

export { app, auth, db, analytics, remoteConfig };
