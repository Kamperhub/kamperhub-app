
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAnalytics, type Analytics } from "firebase/analytics";

// Using the hardcoded configuration for the active project.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_NEEDS_TO_BE_PLACED_HERE", // IMPORTANT: Please replace this with your actual API key
  authDomain: "kamperhub-s4hc2.firebaseapp.com",
  projectId: "kamperhub-s4hc2",
  storageBucket: "kamperhub-s4hc2.appspot.com",
  messagingSenderId: "74707729193",
  appId: "1:74707729193:web:4b1d8eebec8ba295431538",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};


// Initialize Firebase
let app: FirebaseApp;
// A simple check to ensure the API key placeholder has been replaced.
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY_NEEDS_TO_BE_PLACED_HERE') {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} else {
  console.error("Firebase API Key is missing in src/lib/firebase.ts. App functionality will be limited.");
  // Create a dummy app object to avoid crashing the server if the key is missing
  app = {} as FirebaseApp; 
}


// Initialize client-side services
let appCheck: AppCheck | undefined;
let analytics: Analytics | undefined;

if (typeof window !== 'undefined' && app.options?.apiKey) {
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
    console.warn("[Firebase Client] NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY is not set in .env.local. App Check will not be initialized.");
  }
}

const auth: Auth = app.options?.apiKey ? getAuth(app) : {} as Auth;
const db: Firestore = app.options?.apiKey ? getFirestore(app) : {} as Firestore;

export { app, auth, db, appCheck, analytics };
