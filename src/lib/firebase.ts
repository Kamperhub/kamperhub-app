
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAnalytics, type Analytics } from "firebase/analytics";

// This configuration object connects the app to your specific Firebase project.
// It should be filled with your project's specific details.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // This is unique to your project
  authDomain: "kamperhub-s4hc2.firebaseapp.com",
  projectId: "kamperhub-s4hc2",
  storageBucket: "kamperhub-s4hc2.appspot.com",
  messagingSenderId: "74707729193",
  appId: "1:74707729193:web:b06f6dce5757fd1d431538",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};


// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let appCheck: AppCheck | undefined;
let analytics: Analytics | undefined;
export let firebaseInitializationError: string | null = null;

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY' || !firebaseConfig.projectId) {
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
          if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
            (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
            console.log('[Firebase Client] App Check using debug token from environment variable.');
          } else if (process.env.NODE_ENV === 'development') {
            (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
            console.log('[Firebase Client] App Check debug mode is enabled. A debug token might be generated in the browser console.');
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
      console.warn("[Firebase Client] NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY is not set in .env.local. App Check will not be initialized in production.");
    }
  }
}

export { app, auth, db, appCheck, analytics };
