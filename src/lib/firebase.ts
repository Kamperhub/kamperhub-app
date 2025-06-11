
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics'; // Import getAnalytics

// Your web app's Firebase configuration (as provided by user)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined = undefined; // Define analytics variable

const DATABASE_ID = 'kamperhubv2'; // Your named database ID

if (getApps().length === 0) {
  // Using hardcoded config, so no need to check for missing apiKey/projectId from env vars
  app = initializeApp(firebaseConfig);
  console.log("[Firebase] Firebase app initialized with hardcoded config.");
} else {
  app = getApps()[0];
  console.log("[Firebase] Firebase app re-used existing instance.");
}

auth = getAuth(app);
// Initialize Firestore with the specific database ID
db = getFirestore(app, DATABASE_ID);
console.log(`[Firebase] Firestore initialized with database ID: ${DATABASE_ID}`);

// Initialize Analytics only on the client side and if measurementId is present
if (typeof window !== 'undefined') {
  if (firebaseConfig.measurementId) {
    try {
      analytics = getAnalytics(app);
      console.log("[Firebase] Analytics initialized.");
    } catch (e: any) {
      console.error("[Firebase] Error initializing Analytics:", e.message);
    }
  } else {
    console.warn("[Firebase] Analytics not initialized: measurementId is missing or invalid in firebaseConfig.");
  }
}

export { app, auth, db, analytics };
