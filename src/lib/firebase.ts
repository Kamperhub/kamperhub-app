
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAnalytics, type Analytics } from "firebase/analytics";

// This configuration is now loaded from environment variables.
// See the FIREBASE_SETUP_CHECKLIST.md for instructions on how to set these up in your .env.local file.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Simple check to ensure all required config values are present.
const areFirebaseVarsPresent =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

// Initialize Firebase
let app: FirebaseApp;
if (areFirebaseVarsPresent && firebaseConfig.apiKey !== 'your-api-key') {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} else {
  console.error("Firebase environment variables are not set. Please check your .env.local file. App functionality will be limited.");
  // Create a dummy app object to avoid crashing the server if vars are missing
  app = {} as FirebaseApp; 
}


// Initialize client-side services
let appCheck: AppCheck | undefined;
let analytics: Analytics | undefined;

if (typeof window !== 'undefined' && areFirebaseVarsPresent && firebaseConfig.apiKey !== 'your-api-key') {
  analytics = getAnalytics(app);

  // Use the provided debug token for local development.
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
    console.log('[Firebase Client] App Check debug token has been set.');
  }
  
  const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY;
  if(reCaptchaKey && reCaptchaKey !== 'your-recaptcha-enterprise-site-key'){
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
    console.warn("[Firebase Client] NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY is not set. App Check will not be initialized.");
  }

}

const auth: Auth = areFirebaseVarsPresent && firebaseConfig.apiKey !== 'your-api-key' ? getAuth(app) : {} as Auth;
const db: Firestore = areFirebaseVarsPresent && firebaseConfig.apiKey !== 'your-api-key' ? getFirestore(app) : {} as Firestore;

export { app, auth, db, appCheck, analytics };
