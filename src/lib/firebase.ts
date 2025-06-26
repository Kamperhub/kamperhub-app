
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAnalytics, type Analytics } from "firebase/analytics";

// This configuration object connects the app to your specific Firebase project.
// It pulls the values from your environment variables (like .env.local).
// Ensure these environment variables are correctly set in your .env.local file.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;
// Now, your Firebase initialization logic will look for a valid API key
// that comes from your .env.local file, not a placeholder.
if (firebaseConfig.apiKey) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);
} else {
  console.error("Firebase configuration is missing or incomplete. Please ensure your .env.local has the correct NEXT_PUBLIC_FIREBASE_* variables set and your development server is restarted.");
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

  const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY;
  if(reCaptchaKey) {
      try {
        // If a debug token is provided via environment variable, use it directly.
        if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
          (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
          console.log('[Firebase Client] App Check using debug token from environment variable.');
        } else if (process.env.NODE_ENV === 'development') {
          // If no specific debug token is set but we are in development,
          // then activate the SDK's internal debug token generation.
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

const auth: Auth = app.options?.apiKey ? getAuth(app) : {} as Auth;
const db: Firestore = app.options?.apiKey ? getFirestore(app) : {} as Firestore;

export { app, auth, db, appCheck, analytics };
