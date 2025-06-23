
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyB-7todRM_IzeDlV959vKNVPPF0KZeOUmQ", // Updated API Key
  authDomain: "kamperhub-s4hc2.firebaseapp.com",
  projectId: "kamperhub-s4hc2",
  storageBucket: "kamperhub-s4hc2.firebasestorage.app", // Using user provided value
  messagingSenderId: "74707729193",
  appId: "1:74707729193:web:b06f6dce5757fd1d431538",
  measurementId: "G-V1CTQMC6BD"
};

let app: FirebaseApp;
// This pattern prevents re-initializing the app on every render in Next.js.
if (getApps().length === 0) {
  console.log('[Firebase Client] Initializing a new Firebase app...');
  app = initializeApp(firebaseConfig);
} else {
  console.log('[Firebase Client] Re-using existing Firebase app.');
  app = getApp(); // Use getApp() for robustness in Next.js environments
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

let analytics: Analytics | undefined = undefined;

// Initialize Analytics only on the client side where it's supported
if (typeof window !== 'undefined') {
  isSupported().then((isAnalyticsSupported) => {
    if (isAnalyticsSupported && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
      console.log('[Firebase Client] Analytics initialized.');
    } else {
      console.log('[Firebase Client] Analytics not supported or measurementId is missing.');
    }
  }).catch(e => {
    console.error('[Firebase Client] Error checking for Analytics support:', e);
  });
}

export { app, auth, db, analytics };
