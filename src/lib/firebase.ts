
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";

// Your web app's Firebase configuration
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
let appCheck: AppCheck | undefined = undefined;

if (getApps().length === 0) {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      'Firebase configuration is missing or incomplete. Please ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set.'
    );
    app = initializeApp({});
  } else {
    app = initializeApp(firebaseConfig);
  }
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

if (typeof window !== 'undefined') {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const reCAPTCHASiteKeyFromEnv = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
    const isRecaptchaKeyValid = reCAPTCHASiteKeyFromEnv && reCAPTCHASiteKeyFromEnv !== 'your_recaptcha_v3_site_key_here' && reCAPTCHASiteKeyFromEnv.length > 10;

    console.log(`[AppCheck] Effective NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY: "${reCAPTCHASiteKeyFromEnv}"`);
    console.log(`[AppCheck] Is reCAPTCHA key considered valid for use? ${isRecaptchaKeyValid}`);

    if (isRecaptchaKeyValid) {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(reCAPTCHASiteKeyFromEnv),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("[AppCheck] Firebase App Check initialized successfully with reCAPTCHA v3.");
      } catch (e: any) {
        console.error("[AppCheck] Error initializing Firebase App Check with reCAPTCHA v3:", e.message);
        if (e.message && (e.message.includes('reCAPTCHA V3 site key is not valid') || e.message.includes('Invalid site key'))) {
          console.warn("[AppCheck] Ensure your NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is correct and the domain is registered in Google Cloud Console for reCAPTCHA.");
        }
        // If reCAPTCHA init fails, consider debug mode for development
        if (process.env.NODE_ENV === 'development') {
          console.warn("[AppCheck] reCAPTCHA V3 initialization failed. Attempting to initialize App Check in DEBUG MODE for development as a fallback.");
          (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
          try {
            appCheck = initializeAppCheck(app);
            console.log(
              "[AppCheck] Firebase App Check initialized in DEBUG MODE (fallback after reCAPTCHA failure). " +
              "Look for a debug token in your browser's console logs and add it to Firebase Console."
            );
          } catch (debugError: any) {
            console.error("[AppCheck] Error initializing App Check in debug mode (fallback):", debugError.message);
          }
        }
      }
    } else {
      // reCAPTCHA key is not valid (missing, placeholder, or too short)
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          "[AppCheck] Firebase App Check: reCAPTCHA v3 site key not configured, is a placeholder, or too short. " +
          "DEBUG MODE for App Check activated."
        );
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        try {
          appCheck = initializeAppCheck(app);
          console.log(
            "[AppCheck] Firebase App Check initialized in DEBUG MODE. " +
            "Look for a debug token in your browser's console logs (it might appear after an attempted Firebase call), " +
            "then add it to Firebase Console > App Check > Your Web App > Manage debug tokens."
          );
        } catch (e: any) {
          console.error("[AppCheck] Error initializing App Check in debug mode (this might be expected until a debug token is registered or if config is incomplete):", e.message);
        }
      } else { // Production or other non-development environments
        console.warn(
          "[AppCheck] Firebase App Check: reCAPTCHA v3 site key is NOT valid or not configured for this non-development environment. " +
          "App Check will NOT be initialized with reCAPTCHA. " +
          "If App Check is enforced on backend services, Firebase operations might fail."
        );
      }
    }
  } else {
    console.warn("[AppCheck] Firebase App Check: Not initializing because Firebase config (apiKey/projectId) is incomplete.");
  }
} else {
  // console.log("[AppCheck] Firebase App Check: Not initializing (not in a browser environment).");
}

export { app, auth, db, appCheck };

    