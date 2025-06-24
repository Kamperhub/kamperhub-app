
import admin from 'firebase-admin';

const targetProjectId = "kamperhub-s4hc2";

// This check prevents re-initializing the app on every serverless function invocation.
if (!admin.apps.length) {
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  const config: admin.AppOptions = {
    projectId: targetProjectId, // Always force the correct project ID.
  };

  let initialized = false;

  if (serviceAccountJsonString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      
      // *** CRITICAL CHECK ***
      // Only use the credential if it's for the correct project.
      if (serviceAccount.project_id === targetProjectId) {
        config.credential = admin.credential.cert(serviceAccount);
        admin.initializeApp(config);
        console.log(`[Firebase Admin] SDK initialized successfully using service account for project: ${targetProjectId}.`);
        initialized = true;
      } else {
        // The provided service account is for the WRONG project. Do not use it.
        // Log a very clear error and fall back to default credentials below.
        console.error(`[Firebase Admin] FATAL MISMATCH: The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is for project '${serviceAccount.project_id}', but this application requires credentials for '${targetProjectId}'. Ignoring this service account and attempting to initialize with default credentials. Please update your environment variable to use the correct service account key.`);
      }
    } catch (e) {
      console.error('[Firebase Admin] Error parsing service account JSON. The provided GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON. Falling back to default credentials.', e);
    }
  }

  // If initialization didn't happen above (because the env var was missing, invalid, or for the wrong project),
  // initialize with default credentials. The projectId in the config will guide it.
  if (!initialized) {
    console.warn(`[Firebase Admin] Initializing with default credentials for project ${targetProjectId}. This may happen if the service account JSON is missing, invalid, or for the wrong project.`);
    admin.initializeApp(config);
  }
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
