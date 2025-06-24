
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
  // In development, setting this to true will generate a debug token in the console.
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.log('[Firebase Client] App Check DEBUG MODE ENABLED. Look for the debug token in the console and add it to your Firebase project settings.');
  }
  
  try {
    // The debug provider will be used automatically in development due to the flag above.
    // The reCAPTCHA provider will be used in production.
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LcZh2orAAAAACZCrkNWXKNfNK9ha0IE0rJYXlNX'),
      isTokenAutoRefreshEnabled: true
    });
    console.log('[Firebase Client] App Check Initialized successfully.');
  } catch (error) {
    console.error("[Firebase Client] CRITICAL: Error initializing App Check:", error);
  }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, appCheck };
