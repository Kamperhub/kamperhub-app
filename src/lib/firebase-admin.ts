
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export function getFirebaseAdmin() {
  const app = admin.apps.length > 0 && admin.apps[0] ? admin.apps[0] : undefined;

  if (app) {
    return {
      auth: admin.auth(app),
      firestore: getFirestore(app, 'kamperhubv2'),
      error: null
    };
  }

  try {
    const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!serviceAccountJsonString) {
      throw new Error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. The server cannot connect to Firebase services.");
    }

    let jsonString = serviceAccountJsonString.trim();
    if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
        jsonString = jsonString.substring(1, jsonString.length - 1);
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(jsonString);
    } catch (e: any) {
        // This is a new, more specific error catch for malformed JSON.
        throw new Error(`FATAL: The GOOGLE_APPLICATION_CREDENTIALS_JSON string in your .env.local file is not valid JSON. Please copy it again carefully. The JSON parser failed with: ${e.message}`);
    }


    if (!serviceAccount.private_key) {
      throw new Error("FATAL: The 'private_key' field is missing from your service account JSON. Please ensure you have copied the entire JSON file correctly.");
    }
    
    // This replace call is critical for keys copied from .env files
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    const newApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log(`[Firebase Admin] SDK initialized successfully for project: ${serviceAccount.project_id}`);

    return {
      auth: admin.auth(newApp),
      firestore: getFirestore(newApp, 'kamperhubv2'),
      error: null
    };

  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin SDK initialization failed.", error.message);
    return { auth: null, firestore: null, error };
  }
}
