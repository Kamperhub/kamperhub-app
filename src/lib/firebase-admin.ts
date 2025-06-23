import admin from 'firebase-admin';

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (serviceAccountJsonString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase Admin] SDK initialized with service account from environment variable.');
    } catch (e) {
      console.error('[Firebase Admin] Error parsing service account JSON or initializing app:', e);
      // Fallback to default initialization in case of parsing error
      admin.initializeApp();
      console.log('[Firebase Admin] SDK initialized with default credentials as a fallback.');
    }
  } else {
    // Standard initialization method for Firebase-hosted environments
    // This relies on Application Default Credentials.
    admin.initializeApp();
    console.log('[Firebase Admin] SDK initialized with default credentials (env var not found).');
  }
} else {
  console.log('[Firebase Admin] SDK already initialized.');
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
