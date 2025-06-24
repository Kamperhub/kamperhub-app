
import admin from 'firebase-admin';

const targetProjectId = "kamperhub-s4hc2";

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  // This new, simplified approach ignores the GOOGLE_APPLICATION_CREDENTIALS_JSON
  // environment variable which seems to be causing issues.
  // Instead, it relies on Application Default Credentials (ADC) from the
  // user's gcloud login, but forces it to use the correct project ID.
  console.log(`[Firebase Admin] Initializing with default credentials for project: ${targetProjectId}.`);
  admin.initializeApp({
    projectId: targetProjectId,
  });
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
