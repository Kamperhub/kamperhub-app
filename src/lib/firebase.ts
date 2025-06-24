
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

// Only initialize App Check if the environment variable is explicitly set to 'true'.
// This ensures it is OFF by default in local development environments.
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_APP_CHECK === 'true') {
  console.log('[Firebase Client] App Check is ENABLED.');
  
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LcZh2orAAAAACZCrkNWXKNfNK9ha0IE0rJYXlNX'),
      isTokenAutoRefreshEnabled: true
    });
    console.log('[Firebase Client] App Check Initialized successfully with reCAPTCHA Enterprise provider.');
  } catch (error) {
    console.error("[Firebase Client] CRITICAL: Error initializing App Check:", error);
  }
} else if (typeof window !== 'undefined') {
    // This block is for logging, to make it clear why App Check is not running.
    console.log('[Firebase Client] App Check is DISABLED. To enable for production, set NEXT_PUBLIC_ENABLE_APP_CHECK=true in your environment variables.');
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, appCheck };
