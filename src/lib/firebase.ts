
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
  // IMPORTANT: App Check is only initialized in production.
  // This is to prevent reCAPTCHA errors during local development if the Google Cloud project
  // is not fully configured (i.e., reCAPTCHA Enterprise API not enabled or billing not linked).
  if (process.env.NODE_ENV === 'production') {
    try {
      // This is a global variable, so we can check if it's already initialized.
      // This prevents errors on fast refreshes.
      if (!(window as any).appCheckInitialized) {
        // IMPORTANT: This uses the ReCaptchaEnterpriseProvider.
        // The key provided here MUST be a reCAPTCHA Enterprise Site Key.
        // Ensure the "reCAPTCHA Enterprise" API is enabled in your Google Cloud project,
        // and a billing account is linked to the project.
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider('6LcZh2orAAAAACZCrkNWXKNfNK9ha0IE0rJYXlNX'),
          isTokenAutoRefreshEnabled: true
        });
        (window as any).appCheckInitialized = true;
        console.log('[Firebase Client] App Check Initialized with ReCaptchaEnterpriseProvider for Production.');
      }
    } catch (error) {
      console.error("[Firebase Client] CRITICAL: Error initializing App Check in production:", error);
    }
  } else {
    console.log("[Firebase Client] App Check is disabled for local development.");
  }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, appCheck };
