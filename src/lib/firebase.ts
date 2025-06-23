import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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
if (typeof window !== 'undefined') {
  try {
    // This is a global variable, so we can check if it's already initialized.
    // This prevents errors on fast refreshes.
    if (!(window as any).appCheckInitialized) {
      // IMPORTANT: Replace the key below with your own reCAPTCHA v3 site key from the Firebase console.
      // Go to Project Settings > App Check, select your web app, and find the Site Key.
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_V3_PUBLIC_KEY_HERE'),
        isTokenAutoRefreshEnabled: true
      });
      (window as any).appCheckInitialized = true;
      console.log('[Firebase Client] App Check Initialized.');
    }
  } catch (error) {
    console.error("[Firebase Client] Error initializing App Check:", error);
  }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
