
import admin from 'firebase-admin';

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  console.log("[Firebase Admin] Initializing Admin SDK with Application Default Credentials.");
  // In a managed environment like App Hosting or a local setup with `gcloud auth application-default login`,
  // the SDK automatically discovers project configuration. Explicitly setting the projectId can sometimes
  // cause conflicts, so this more standard approach is preferred.
  admin.initializeApp();
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
