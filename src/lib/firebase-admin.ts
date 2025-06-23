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
      console.log(`[Firebase Admin] SDK initialized successfully for project: ${serviceAccount.project_id}.`);
    } catch (e) {
      console.error('[Firebase Admin] FATAL: Could not parse service account JSON. Falling back to default init.', e);
      // Fallback to default initialization in case of parsing error
      admin.initializeApp();
      console.log('[Firebase Admin] SDK initialized with default credentials as a fallback.');
    }
  } else {
    // Standard initialization method for Firebase-hosted environments
    // This relies on Application Default Credentials.
    console.warn('[Firebase Admin] WARNING: GOOGLE_APPLICATION_CREDENTIALS_JSON not found. Initializing with default credentials. Ensure this is intended.');
    admin.initializeApp();
    console.log('[Firebase Admin] SDK initialized with default credentials.');
  }
} else {
  console.log(`[Firebase Admin] SDK already initialized for project: ${admin.apps[0]?.options.credential ? 'service-account' : 'default'}.`);
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
