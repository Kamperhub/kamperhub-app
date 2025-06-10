
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Uncomment if you need Firebase Storage

// Your web app's Firebase configuration
// These values should be stored in your .env.local file for security
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional: for Google Analytics
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
// let storage: FirebaseStorage; // Uncomment if you need Firebase Storage

// Initialize Firebase
if (getApps().length === 0) {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      'Firebase configuration is missing or incomplete. Please ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set in your .env file.'
    );
    // You might want to throw an error here or handle it more gracefully
    // For now, we'll let it proceed, but Firebase services won't work.
    // Create a dummy app to prevent errors if config is missing,
    // but functionality will be broken.
    app = initializeApp({}); // Initialize with empty config if vars are missing
  } else {
     app = initializeApp(firebaseConfig);
  }
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);
// storage = getStorage(app); // Uncomment if you need Firebase Storage

export { app, auth, db /*, storage */ };
