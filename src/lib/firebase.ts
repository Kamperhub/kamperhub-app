
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";

// Your web app's Firebase configuration
// These values should be stored in your .env.local file for security
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional: for Google Analytics
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let appCheck: AppCheck | undefined = undefined;

// Initialize Firebase
if (getApps().length === 0) {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      'Firebase configuration is missing or incomplete. Please ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set in your .env file.'
    );
    // Initialize with empty config if vars are missing to avoid hard crash, though Firebase services won't work.
    app = initializeApp({});
  } else {
     app = initializeApp(firebaseConfig);
  }
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

// Initialize App Check
if (typeof window !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.projectId) {
  const reCAPTCHASiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
  console.log("[AppCheck] NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY from env:", reCAPTCHASiteKey); // Diagnostic log

  const isRecaptchaKeyValid = reCAPTCHASiteKey && reCAPTCHASiteKey !== 'your_recaptcha_v3_site_key_here' && reCAPTCHASiteKey.length > 10;
  console.log("[AppCheck] Is reCAPTCHA key considered valid for use?", isRecaptchaKeyValid); // Diagnostic log

  if (isRecaptchaKeyValid) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(reCAPTCHASiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log("Firebase App Check initialized successfully with reCAPTCHA v3.");
    } catch (e: any) {
      console.error("Error initializing Firebase App Check with reCAPTCHA v3:", e.message);
      if (e.message && e.message.includes('reCAPTCHA V3 site key is not valid')) {
        console.warn("Ensure your NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is correct and the domain is registered in Google Cloud Console for reCAPTCHA.");
      }
    }
  } else {
    // Fallback for local development using debug token, if reCAPTCHA key is not set or is a placeholder.
    if (process.env.NODE_ENV === 'development') {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        console.log(
        "Firebase App Check: reCAPTCHA v3 site key not configured, is a placeholder, or too short. DEBUG MODE for App Check activated. " +
        "Look for a debug token in your browser's console logs (it might appear after an attempted Firebase call), " +
        "then add it to Firebase Console > App Check > Your Web App > Manage debug tokens."
        );
        try {
            // Simpler call for debug mode, relying on the global debug flag.
            // isTokenAutoRefreshEnabled defaults to true.
            appCheck = initializeAppCheck(app);
            console.log("[AppCheck] Attempted initialization in debug mode.");
        } catch(e: any) {
            console.error("Error initializing App Check in debug mode (this might be expected until a debug token is registered):", e.message);
        }

    } else {
        console.warn(
            "Firebase App Check: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is not configured or is a placeholder. " +
            "App Check will not be initialized with reCAPTCHA for production. " +
            "If App Check is enforced, Firebase operations might fail."
        );
    }
  }
} else if (typeof window !== 'undefined') {
  console.warn("Firebase App Check not initialized because Firebase config is incomplete or not in a browser environment.");
}


export { app, auth, db, appCheck };
