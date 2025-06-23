import admin from 'firebase-admin';

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const targetProjectId = "kamperhub-s4hc2"; // Explicitly define your target project ID

  if (serviceAccountJsonString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      if (serviceAccount.project_id !== targetProjectId) {
         console.error(`[Firebase Admin] FATAL: Service account project ID mismatch. Expected '${targetProjectId}', but service account is for '${serviceAccount.project_id}'.`);
         // We will still attempt to initialize, but this log is critical.
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`[Firebase Admin] SDK initialized successfully using service account for project: ${serviceAccount.project_id}.`);
    } catch (e) {
      console.error('[Firebase Admin] FATAL: Could not parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Falling back to default init.', e);
      admin.initializeApp();
      console.error('[Firebase Admin] SDK initialized with default (likely incorrect) credentials due to JSON parsing error.');
    }
  } else {
    // This block is the likely cause of the error.
    // The hosting environment's default project is 'monospace-6', not 'kamperhub-s4hc2'.
    console.error(`[Firebase Admin] FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set.`);
    console.error(`[Firebase Admin] Attempting to initialize with default credentials, which may point to the wrong project (like 'monospace-6').`);
    console.error(`[Firebase Admin] To fix this, you MUST set the GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable with the service account key for the '${targetProjectId}' project.`);
    admin.initializeApp();
  }
} else {
  // This is fine, just logs that it's already running.
  console.log(`[Firebase Admin] SDK already initialized.`);
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
