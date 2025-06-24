
import admin from 'firebase-admin';

// This check prevents re-initializing the app on every serverless function invocation.
// This is the simplest and most standard way to initialize.
// It relies on Application Default Credentials being set up in the environment.
if (!admin.apps.length) {
  console.log("[Firebase Admin] Initializing Admin SDK with Application Default Credentials.");
  admin.initializeApp();
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
