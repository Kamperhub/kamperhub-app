
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAnalytics, type Analytics } from "firebase/analytics";

// This configuration object connects the app to your specific Firebase project.
// Make sure to replace "YOUR_API_KEY" with your actual Firebase Web API Key.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Important: Replace this with your actual API key!
  authDomain: "kamperhub-s4hc2.firebaseapp.com",
  projectId: "kamperhub-s4hc2",
  storageBucket: "kamperhub-s4hc2.appspot.com",
  messagingSenderId: "74707729193",
  appId: "1:74707729193:web:b06f6dce5757fd1d431538",
  measurementId: "G-XXXXXXXXXX" // Optional: Add your Measurement ID for Google Analytics
};

// Initialize Firebase
let app: FirebaseApp;
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} else {
  console.error("Firebase configuration is missing or incomplete. Please add your API Key to src/lib/firebase.ts");
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
