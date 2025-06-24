
import admin from 'firebase-admin';

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  // Relying on Application Default Credentials (ADC).
  // Ensure you have run `gcloud auth application-default login` for the correct project.
  // The SDK will automatically pick up the project ID from the credentials.
  console.log("[Firebase Admin] Initializing with Application Default Credentials.");
  admin.initializeApp();
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
