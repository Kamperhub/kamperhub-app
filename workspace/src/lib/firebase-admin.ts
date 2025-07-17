
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
    const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!serviceAccountJsonString) {
      throw new Error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. The server cannot connect to Firebase services.");
    }
    
    if (!clientProjectId) {
        throw new Error("FATAL: NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not set. Cannot verify server-side configuration.");
    }

    let jsonString = serviceAccountJsonString.trim();
    if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
        jsonString = jsonString.substring(1, jsonString.length - 1);
    }
    
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(jsonString);
    } catch (e: any) {
        throw new Error(`FATAL: The GOOGLE_APPLICATION_CREDENTIALS_JSON string in your .env.local file is not valid JSON. Please copy it again carefully. The JSON parser failed with: ${e.message}`);
    }

    if (serviceAccount.project_id !== clientProjectId) {
        throw new Error(`FATAL: Project ID Mismatch. Server key is for project '${serviceAccount.project_id}', but client keys are for project '${clientProjectId}'. All keys in your .env.local file MUST come from the same Firebase project. Please review the 'FIREBASE_SETUP_CHECKLIST.md' guide carefully.`);
    }

    if (!serviceAccount.private_key) {
      throw new Error("FATAL: The 'private_key' field is missing from your service account JSON. Please ensure you have copied the entire JSON file correctly.");
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
