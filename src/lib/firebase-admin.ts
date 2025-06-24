
import admin from 'firebase-admin';

const targetProjectId = "kamperhub-s4hc2";

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  const config: admin.AppOptions = {
    projectId: targetProjectId,
  };

  if (serviceAccountJsonString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      config.credential = admin.credential.cert(serviceAccount);
      
      if (serviceAccount.project_id !== targetProjectId) {
         console.warn(`[Firebase Admin] Mismatch Warning: Service account is for project '${serviceAccount.project_id}', but this app is configured for '${targetProjectId}'. Forcing the correct project ID.`);
      }
      
      admin.initializeApp(config);
      console.log(`[Firebase Admin] SDK initialized for project: ${targetProjectId}.`);
      
    } catch (e) {
      console.error('[Firebase Admin] Error parsing service account JSON. Initializing with default credentials.', e);
      admin.initializeApp(config); // Initialize with projectId even on error
    }
  } else {
    console.warn(`[Firebase Admin] GOOGLE_APPLICATION_CREDENTIALS_JSON not set. Initializing with default credentials for project ${targetProjectId}.`);
    // Initialize with default credentials but forced project ID
    admin.initializeApp(config);
  }
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
