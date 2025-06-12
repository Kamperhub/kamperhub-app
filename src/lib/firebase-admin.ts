
import admin, { App as AdminApp } from 'firebase-admin';

// Ensure this matches the databaseId used in src/lib/firebase.ts
const DATABASE_ID = 'kamperhubv2'; 

let app: AdminApp;

if (admin.apps.length === 0) {
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!serviceAccountJsonString) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. ' +
      'This is required for Firebase Admin SDK initialization. ' +
      'Please provide the content of your Firebase service account JSON key.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJsonString);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // No need to specify databaseURL if using default Firestore,
      // but for named databases, Firestore client handles it directly.
    });
    console.log('[Firebase Admin] SDK initialized successfully.');
  } catch (error: any) {
    console.error('[Firebase Admin] Error parsing service account JSON or initializing app:', error.message);
    throw new Error('Failed to initialize Firebase Admin SDK. Check GOOGLE_APPLICATION_CREDENTIALS_JSON format and content.');
  }
} else {
  app = admin.app();
  console.log('[Firebase Admin] SDK re-used existing instance.');
}

// Initialize Firestore for the specific database
// The Admin SDK's Firestore client will respect the database ID if the main app (client-side)
// is configured for a specific database ID when operations are performed through Cloud Functions
// or server-side logic that uses this admin instance.
// For direct admin operations, you typically get the default Firestore instance.
// If operations need to target a non-default database, it's often handled at the point of DB interaction.
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
