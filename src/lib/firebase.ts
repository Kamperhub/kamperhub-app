
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";

// This configuration is for the "Kamperhub" web app registration in the Firebase Console.
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
  // Using a debug token is the recommended way to test App Check locally without
  // encountering reCAPTCHA errors. This token is only used in development.
  if (process.env.NODE_ENV === 'development') {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = "DC0219-7521-4905-A5CB-6970EDC500BB";
    console.log('[Firebase Client] App Check debug token has been set for local development.');
  }

  // This check prevents re-initializing App Check on every hot-reload in development.
  if (!(window as any).appCheckInitialized) {
    (window as any).appCheckInitialized = true;

    try {
      // Initialize App Check with the reCAPTCHA Enterprise provider.
      // In development, the debug token will be used automatically if set.
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider('6LcZh2orAAAAACZCrkNWXKNfNK9ha0IE0rJYXlNX'),
        isTokenAutoRefreshEnabled: true
      });
      console.log('[Firebase Client] App Check Initialized.');
    } catch (error) {
      console.error("[Firebase Client] CRITICAL: Error initializing App Check:", error);
    }
  }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, appCheck };
