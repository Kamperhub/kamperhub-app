import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";

// This configuration is for the "Kamperhub" web app registration in the Firebase Console.
// Any settings (like App Check) should be applied to that specific app.
const firebaseConfig = {
  apiKey: "AIzaSyB-7todRM_IzeDlV959vKNVPPF0KZeOUmQ", // Updated API Key
  authDomain: "kamperhub-s4hc2.firebaseapp.com",
  projectId: "kamperhub-s4hc2",
  storageBucket: "kamperhub-s4hc2.firebasestorage.app", // Using user provided value
  messagingSenderId: "74707729193",
  appId: "1:74707729193:web:b06f6dce5757fd1d431538",
  measurementId: "G-V1CTQMC6BD"
};

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize App Check on the client
let appCheck: AppCheck | undefined;
if (typeof window !== 'undefined') {
  // For local development, you can use a debug token to bypass App Check.
  // This is useful if you are having trouble with reCAPTCHA Enterprise setup.
  // Make sure to remove this before deploying to production if you want real enforcement.
  if (process.env.NODE_ENV === 'development') {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.log('[Firebase Client] App Check DEBUG TOKEN is enabled for local development.');
  }

  try {
    // This is a global variable, so we can check if it's already initialized.
    // This prevents errors on fast refreshes.
    if (!(window as any).appCheckInitialized) {
      // IMPORTANT: This uses the ReCaptchaEnterpriseProvider.
      // The key provided here MUST be a reCAPTCHA Enterprise Site Key.
      // Ensure the "reCAPTCHA Enterprise" API is enabled in your Google Cloud project.
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider('6LcZh2orAAAAACZCrkNWXKNfNK9ha0IE0rJYXlNX'),
        isTokenAutoRefreshEnabled: true
      });
      (window as any).appCheckInitialized = true;
      console.log('[Firebase Client] App Check Initialized with ReCaptchaEnterpriseProvider.');
    }
  } catch (error) {
    console.error("[Firebase Client] Error initializing App Check:", error);
  }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, appCheck };
