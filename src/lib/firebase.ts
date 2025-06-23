
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
if (!getApps().length) {
  console.log('[Firebase Client] Initializing a new Firebase app...');
  app = initializeApp(firebaseConfig);
} else {
  console.log('[Firebase Client] Re-using existing Firebase app.');
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Analytics initialization has been removed to simplify the connection process
// and help resolve the "client is offline" error.

export { app, auth, db };
