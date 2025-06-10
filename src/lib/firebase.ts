
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check"; // Added for App Check

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
let appCheck: AppCheck | undefined = undefined; // Variable for App Check instance

// Initialize Firebase
if (getApps().length === 0) {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      'Firebase configuration is missing or incomplete. Please ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set in your .env file.'
    );
    app = initializeApp({}); // Initialize with empty config if vars are missing
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
  // Set the debug token flag for local development
  // IMPORTANT: THIS SHOULD ONLY BE ENABLED FOR LOCAL DEVELOPMENT AND TESTING
  // In a production environment, you should rely on a real attestation provider like reCAPTCHA v3.
  if (process.env.NODE_ENV === 'development') {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.log(
      "Firebase App Check DEBUG MODE activated for local development. " +
      "If you see App Check errors, look for a debug token in your browser's console logs (it might appear after an attempted Firebase call), " +
      "then add it to Firebase Console > App Check > Your Web App > Manage debug tokens."
    );
  }

  // Attempt to initialize App Check, even in dev with the debug token flag.
  // For production, you'd typically use ReCaptchaV3Provider and ensure
  // NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is set.
  // For now, this setup prioritizes getting local dev unblocked.
  try {
    appCheck = initializeAppCheck(app, {
      // In a real production app, you would use a provider like:
      // provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY!),
      // For now, if the debug token is set, Firebase should use it.
      // If you have a reCAPTCHA key, you can use it here. If not, this might still fail
      // in production if App Check is enforced without a provider or debug token.
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY || 'missing-site-key'), // Provide a placeholder if key is missing to avoid error, debug token takes precedence in dev.
      isTokenAutoRefreshEnabled: true
    });
    console.log("Attempted Firebase App Check initialization.");
  } catch (e) {
    console.error("Error initializing Firebase App Check:", e);
    console.warn("If App Check is enforced in your Firebase project, ensure you have a valid provider (e.g., reCAPTCHA v3) configured for production, or a debug token for local development.");
  }
} else if (typeof window !== 'undefined') {
  console.warn("Firebase App Check not initialized because Firebase config is incomplete.");
}


export { app, auth, db, appCheck };
