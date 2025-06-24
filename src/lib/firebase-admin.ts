
import admin from 'firebase-admin';

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (serviceAccountJson) {
    console.log("[Firebase Admin] Initializing Admin SDK with service account from environment variable.");
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.log("[Firebase Admin] Initializing Admin SDK with Application Default Credentials (no service account variable found).");
    // Fallback to default credentials if the env var is not set.
    admin.initializeApp();
  }
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
