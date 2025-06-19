
import admin, { App as AdminApp } from 'firebase-admin';

// Ensure this matches the databaseId used in src/lib/firebase.ts
const DATABASE_ID = 'kamperhubv2'; 

let app: AdminApp;

if (admin.apps.length === 0) {
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (serviceAccountJsonString) {
    // If GOOGLE_APPLICATION_CREDENTIALS_JSON is explicitly provided (e.g., local dev), use it.
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase Admin] SDK initialized successfully using GOOGLE_APPLICATION_CREDENTIALS_JSON.');
    } catch (error: any) {
      console.error('[Firebase Admin] Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON or initializing app with it:', error.message);
      // Fallback to default initialization if parsing fails but we are in an env that might provide it
      console.warn('[Firebase Admin] Falling back to default initialization due to error with explicit credentials. Ensure the build/runtime environment provides default credentials.');
      app = admin.initializeApp();
      console.log('[Firebase Admin] SDK initialized successfully with default credentials (after explicit credential failure).');
    }
  } else {
    // If GOOGLE_APPLICATION_CREDENTIALS_JSON is not explicitly provided (e.g., Firebase Hosting, Cloud Functions),
    // initialize without arguments to use Application Default Credentials.
    app = admin.initializeApp();
    console.log('[Firebase Admin] SDK initialized successfully with default credentials (GOOGLE_APPLICATION_CREDENTIALS_JSON was not set).');
  }
} else {
  app = admin.app();
  console.log('[Firebase Admin] SDK re-used existing instance.');
}

// Initialize Firestore for the specific database
const firestore = admin.firestore(app);
// Note: The Admin SDK Firestore client gets the default database.
// To work with a *named database* (like 'kamperhubv2') specifically through the Admin SDK
// if it's *not* the default "(default)" database in your Firebase project,
// the client-side Firestore (from `src/lib/firebase.ts`) is already configured for 'kamperhubv2'.
// The admin SDK generally accesses the default DB unless you're in an environment
// (like Cloud Functions Gen 2) where the database ID is implicitly part of the environment or
// you explicitly manage multiple Firestore instances with the Admin SDK, which is more complex.
// For our current webhook use case, if the user's UID is known, updating their doc in the 'kamperhubv2'
// database will work as expected because the document path `users/{uid}` will be resolved correctly
// by the client-side configured Firestore when the user interacts with the app, and the admin SDK
// will update that same document path.

export { app as adminApp, firestore as adminFirestore, admin };
