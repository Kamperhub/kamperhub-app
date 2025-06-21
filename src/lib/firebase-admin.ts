
import admin, { type App as AdminApp } from 'firebase-admin';

// Ensure this matches the databaseId used in src/lib/firebase.ts
// const DATABASE_ID = 'kamperhubv2'; // Not directly used by admin.firestore() for default db with Admin SDK like this.

let app: AdminApp | undefined = undefined; // Initialize as undefined
let firestore: admin.firestore.Firestore | undefined = undefined; // Initialize as undefined

try {
  if (admin.apps.length > 0) {
    app = admin.app();
    console.log('[Firebase Admin] SDK re-used existing instance.');
  } else {
    const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountJsonString) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJsonString);
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('[Firebase Admin] SDK initialized successfully using GOOGLE_APPLICATION_CREDENTIALS_JSON.');
      } catch (parseError: any) {
        console.error('[Firebase Admin] Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON or initializing with it:', parseError.message);
        console.warn('[Firebase Admin] Falling back to default credential initialization due to explicit credential failure.');
        // Fall through to default initialization attempt
        app = admin.initializeApp(); // This might throw if ADC is also bad
        console.log('[Firebase Admin] SDK initialized successfully with default credentials (after explicit credential failure).');
      }
    } else {
      // GOOGLE_APPLICATION_CREDENTIALS_JSON is not set, rely on Application Default Credentials
      app = admin.initializeApp();
      console.log('[Firebase Admin] SDK initialized successfully with default credentials (GOOGLE_APPLICATION_CREDENTIALS_JSON was not set).');
    }
  }

  if (app) {
    firestore = admin.firestore(app); // Get Firestore instance for the initialized app
    // Note: This will point to the default Firestore database in the project.
  } else {
    console.error('[Firebase Admin] CRITICAL: Firebase Admin App was NOT initialized. Firestore client will be undefined.');
  }

} catch (initializationError: any) {
  console.error('[Firebase Admin] CRITICAL ERROR during Firebase Admin SDK initialization process:', initializationError.message);
  // app and firestore will remain undefined
}

// Exporting admin object itself for auth, and the initialized app and firestore instances.
export { app as adminApp, firestore as adminFirestore, admin };
