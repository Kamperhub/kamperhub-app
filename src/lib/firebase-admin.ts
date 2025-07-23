
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export function getFirebaseAdmin() {
  // If the app is already initialized, return the existing instances.
  if (admin.apps.length > 0 && admin.apps[0]) {
    const app = admin.apps[0];
    const firestore = getFirestore(app, 'kamperhubv2');
    if (!firestore) {
      // This case can happen if the database with the specified ID doesn't exist.
      const error = new Error("FATAL: Failed to get Firestore instance for database 'kamperhubv2'. Please ensure a Firestore database with this exact ID exists in your Firebase project.");
      console.error("CRITICAL: Firebase Admin SDK initialization failed.", error);
      return { auth: null, firestore: null, error };
    }
    return {
      auth: admin.auth(app),
      firestore: firestore,
      error: null
    };
  }

  // If not initialized, proceed with the setup.
  try {
    const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!serviceAccountJsonString) {
      throw new Error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. The server cannot connect to Firebase services.");
    }
    
    if (!clientProjectId) {
        throw new Error("FATAL: NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not set. Cannot verify server-side configuration.");
    }

    // Clean the JSON string by removing potential leading/trailing single quotes.
    let jsonString = serviceAccountJsonString.trim();
    if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
        jsonString = jsonString.substring(1, jsonString.length - 1);
    }
    
    let serviceAccount;
    try {
        // Parse the string into a JavaScript object.
        const parsedJson = JSON.parse(jsonString);
        // Explicitly replace escaped newlines in the private key with actual newlines.
        if (parsedJson.private_key) {
            parsedJson.private_key = parsedJson.private_key.replace(/\\n/g, '\n');
        }
        serviceAccount = parsedJson;
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
    
    const firestore = getFirestore(newApp, 'kamperhubv2');
    if (!firestore) {
      throw new Error("FATAL: Failed to get Firestore instance for database 'kamperhubv2' after initializing a new app. Please ensure a Firestore database with this exact ID exists.");
    }

    return {
      auth: admin.auth(newApp),
      firestore: firestore,
      error: null
    };

  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin SDK initialization failed.", error);
    // Return the error object so the caller knows initialization failed.
    return { auth: null, firestore: null, error };
  }
}
