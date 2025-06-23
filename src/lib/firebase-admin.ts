import admin from 'firebase-admin';

const targetProjectId = "kamperhub-s4hc2";

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (serviceAccountJsonString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      if (serviceAccount.project_id !== targetProjectId) {
         console.warn(`[Firebase Admin] Service account project ID mismatch. Expected '${targetProjectId}', but service account is for '${serviceAccount.project_id}'.`);
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`[Firebase Admin] SDK initialized for project: ${serviceAccount.project_id}.`);
    } catch (e) {
      console.error('[Firebase Admin] Error parsing service account JSON. Initializing with default credentials.', e);
      admin.initializeApp();
    }
  } else {
    console.warn(`[Firebase Admin] GOOGLE_APPLICATION_CREDENTIALS_JSON not set. Initializing with default credentials. This may fail or connect to the wrong project.`);
    admin.initializeApp();
  }
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
