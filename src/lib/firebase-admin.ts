
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Define interfaces for a clear return type
interface FirebaseAdminInstances {
  firestore: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  error: null;
}

interface FirebaseAdminError {
  firestore: undefined;
  auth: undefined;
  error: Error;
}

// This self-invoking function initializes the admin SDK ONCE when the module is first imported.
// This is a more robust pattern than initializing on every request.
const adminInstances: FirebaseAdminInstances | FirebaseAdminError = (() => {
  if (admin.apps.length > 0) {
    console.log("[Firebase Admin] Re-using existing initialized app.");
    return {
      firestore: getFirestore(),
      auth: admin.auth(),
      error: null
    };
  }

  try {
    const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!serviceAccountJsonString) {
      throw new Error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. The server cannot connect to Firebase services. Please follow the setup checklist.");
    }

    let jsonString = serviceAccountJsonString.trim();
    if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
      jsonString = jsonString.substring(1, jsonString.length - 1);
    }
    
    const serviceAccount = JSON.parse(jsonString);
    
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (!serviceAccount.project_id) {
        throw new Error("Service account JSON is missing the 'project_id' field.");
    }

    console.log("[Firebase Admin] Initializing with Project ID from service account:", serviceAccount.project_id);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // This is the critical line to ensure the SDK targets the correct project database.
      projectId: serviceAccount.project_id,
    });

    console.log("[Firebase Admin] SDK initialized successfully.");
    return {
      firestore: getFirestore(),
      auth: admin.auth(),
      error: null,
    };
  } catch (e: any) {
    const errorSnippet = (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || "undefined").substring(0, 75).replace(/\s/g, '');
    const errorMessage = `Failed to initialize Firebase Admin SDK. Please check your GOOGLE_APPLICATION_CREDENTIALS_JSON. It may be malformed or for the wrong project. Server sees: "${errorSnippet}...". Original error: ${e.message}`;
    console.error(`[Firebase Admin] ${errorMessage}`);
    return {
      firestore: undefined,
      auth: undefined,
      error: new Error(errorMessage),
    };
  }
})();

/**
 * Gets the initialized Firebase Admin instances (firestore, auth) or an error object.
 * This function now simply returns the result of the one-time initialization.
 */
export function getFirebaseAdmin(): FirebaseAdminInstances | FirebaseAdminError {
  return adminInstances;
}
