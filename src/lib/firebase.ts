import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
export let firebaseInitializationError: string | null = null;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  firebaseInitializationError = "CRITICAL ERROR: Firebase client-side configuration is missing. Please ensure all NEXT_PUBLIC_FIREBASE_* variables are set in your .env.local file and that you have restarted the development server. The application cannot connect to Firebase.";
  console.error(`[Firebase Client] ${firebaseInitializationError}`);
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
} else {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);
    auth = getAuth(app);
    db = getFirestore(app, 'kamperhubv2');

    console.log(`[Firebase Client] Successfully initialized for project: ${firebaseConfig.projectId}, connecting to database 'kamperhubv2'.`);

    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db)
        .then(() => console.log('[Firebase Client] Firestore offline persistence enabled.'))
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('[Firebase Client] Firestore offline persistence could not be enabled. Multiple tabs open?');
          } else if (err.code === 'unimplemented') {
            console.warn('[Firebase Client] Firestore offline persistence is not available in this browser.');
          } else {
             console.error("[Firebase Client] Error enabling Firestore offline persistence:", err);
          }
        });
    }
  } catch (e: any) {
    firebaseInitializationError = `Firebase failed to initialize. Please check your Firebase project configuration and API keys. Error: ${e.message}`;
    console.error(`[Firebase Client] ${firebaseInitializationError}`, e);
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
  }
}

export { app, auth, db };
