
import admin from 'firebase-admin';

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  console.log("[Firebase Admin] Initializing Admin SDK.");
  // Explicitly setting the projectId helps the SDK locate the correct project,
  // resolving potential ambiguities when using Application Default Credentials in some environments.
  admin.initializeApp({
    projectId: "kamperhub-s4hc2",
  });
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
