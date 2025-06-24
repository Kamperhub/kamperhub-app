
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
  // Use the provided debug token for local development.
  if (process.env.NODE_ENV === 'development') {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = 'CF1E2CEF-6BAB-45E6-9CE8-4676FE922C4E';
    console.log('[Firebase Client] App Check debug token has been set.');
  }

  // Initialize App Check. In dev mode, it will use the debug provider automatically if the flag is set.
  // In production, it will use the reCAPTCHA provider.
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LcZh2orAAAAACZCrkNWXKNfNK9ha0IE0rJYXlNX'),
      isTokenAutoRefreshEnabled: true
    });
    console.log('[Firebase Client] App Check initialized.');
  } catch (error) {
    console.error("[Firebase Client] CRITICAL: Error initializing App Check:", error);
  }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, appCheck };
