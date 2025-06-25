
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAnalytics, type Analytics } from "firebase/analytics";

// This configuration is now loaded from environment variables.
// Make sure you have a .env.local file with the correct values.
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
// A simple check to ensure the necessary keys are present before initializing.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} else {
  console.error("Firebase configuration is missing or incomplete. Please check your .env.local file and the FIREBASE_SETUP_CHECKLIST.md");
  // Create a dummy app object to avoid crashing the server if keys are missing
  app = {} as FirebaseApp;
}

// Initialize client-side services
let appCheck: AppCheck | undefined;
let analytics: Analytics | undefined;

if (typeof window !== 'undefined' && app.options?.apiKey) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Failed to initialize Firebase Analytics:", error);
  }

  if (process.env.NODE_ENV === 'development') {
    if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
      console.log('[Firebase Client] App Check debug token has been set.');
    } else {
      console.warn("[Firebase Client] NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN is not set. App Check may fail in local development.");
    }
  }

  const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY;
  if(reCaptchaKey) {
      try {
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

const auth: Auth = app.options?.apiKey ? getAuth(app) : {} as Auth;
const db: Firestore = app.options?.apiKey ? getFirestore(app) : {} as Firestore;

export { app, auth, db, appCheck, analytics };
