
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

// This will hold the initialized instances so we don't re-initialize on every call.
let adminInstances: FirebaseAdminInstances | FirebaseAdminError | undefined;

/**
 * Initializes the Firebase Admin SDK on the first call, then reuses the connection.
 * This "lazy initialization" is safer as it doesn't run at the module's top level,
 * preventing server crashes if there's an issue with the environment variables.
 */
function initializeAdmin(): FirebaseAdminInstances | FirebaseAdminError {
  // If we've already initialized (successfully or with an error), return the stored result.
  if (adminInstances) {
    return adminInstances;
  }

  // If there are already apps, it means another part of the system initialized. We can just use it.
  if (admin.apps.length > 0) {
    console.log("[Firebase Admin] Re-using existing initialized app.");
    adminInstances = {
      firestore: getFirestore(),
      auth: admin.auth(),
      error: null,
    };
    return adminInstances;
  }

  // First time initialization
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
      projectId: serviceAccount.project_id,
    });

    console.log("[Firebase Admin] SDK initialized successfully on demand.");
    adminInstances = {
      firestore: getFirestore(),
      auth: admin.auth(),
      error: null,
    };
  } catch (e: any) {
    const errorSnippet = (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || "undefined").substring(0, 75).replace(/\s/g, '');
    const errorMessage = `Failed to initialize Firebase Admin SDK. Please check your GOOGLE_APPLICATION_CREDENTIALS_JSON. It may be malformed. Server sees: "${errorSnippet}...". Original error: ${e.message}`;
    console.error(`[Firebase Admin] ${errorMessage}`);
    adminInstances = {
      firestore: undefined,
      auth: undefined,
      error: new Error(errorMessage),
    };
  }
  
  return adminInstances;
}

/**
 * Gets the initialized Firebase Admin instances (firestore, auth) or an error object.
 * This function ensures initialization happens only once.
 */
export function getFirebaseAdmin(): FirebaseAdminInstances | FirebaseAdminError {
  // If adminInstances hasn't been created yet, this call will create it.
  // Subsequent calls will return the already-created instances.
  return initializeAdmin();
}
