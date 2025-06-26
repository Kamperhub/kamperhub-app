
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAnalytics, type Analytics } from "firebase/analytics";

// --- Firebase Configuration ---
// This is the primary method for configuring Firebase.
// It directly uses your project's configuration keys. This is a simpler and more reliable
// setup for the development environment than using environment variables, which can sometimes
// fail to load correctly.
//
// HOW TO CONFIGURE:
// 1. Go to your Firebase project settings in the Firebase Console.
// 2. Find your web app's "Firebase SDK snippet" and select the "Config" option.
// 3. Copy the configuration object and paste it here, replacing the placeholder values.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // <-- PASTE YOUR KEY HERE
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id" // Optional
};

// This secondary block attempts to read from environment variables if the placeholders above aren't changed.
// This is for advanced users who prefer using a .env.local file.
if (firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
  Object.assign(firebaseConfig, {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });
}


// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let appCheck: AppCheck | undefined;
let analytics: Analytics | undefined;
export let firebaseInitializationError: string | null = null;

// Validate that the configuration has been updated
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_API_KEY')) {
  firebaseInitializationError = "Firebase configuration is missing or incomplete. Please add your API Key to the `firebaseConfig` object in `src/lib/firebase.ts`.";
  console.error(`[Firebase Client] ${firebaseInitializationError}`);
  // Assign empty objects to prevent downstream hard errors, the UI will show the config error.
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
} else {
  // Initialize Firebase if config is valid
  app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);
  auth = getAuth(app);
  db = getFirestore(app);

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
             (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN || true;
             if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
                console.log('[Firebase Client] App Check using debug token from .env.local.');
             } else {
                console.warn('[Firebase Client] App Check debug mode is enabled. If you see App Check errors, you may need to add a debug token to your .env.local file. Check the browser console for the token.');
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
}

export { app, auth, db, appCheck, analytics };
