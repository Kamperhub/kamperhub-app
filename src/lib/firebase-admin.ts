
import admin from 'firebase-admin';

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

let instance: FirebaseAdminInstances | FirebaseAdminError | null = null;

function initializeFirebaseAdmin(): FirebaseAdminInstances | FirebaseAdminError {
  // If the app is already initialized, return the existing instances.
  // This is the core of the singleton pattern for this module.
  if (admin.apps.length) {
    return {
      firestore: admin.firestore(),
      auth: admin.auth(),
      error: null,
    };
  }

  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccountJsonString) {
    return {
      firestore: undefined,
      auth: undefined,
      error: new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. Please follow the setup checklist."),
    };
  }

  try {
    let jsonString = serviceAccountJsonString.trim();
    if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
      jsonString = jsonString.substring(1, jsonString.length - 1);
    }
    
    const serviceAccount = JSON.parse(jsonString);
    
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("[Firebase Admin] SDK initialized successfully.");
    return {
      firestore: admin.firestore(),
      auth: admin.auth(),
      error: null,
    };
  } catch (e: any) {
    const errorSnippet = (serviceAccountJsonString || "undefined").substring(0, 75).replace(/\s/g, '');
    const error = new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's valid, unescaped JSON on a single line. Server sees: "${errorSnippet}...". Original error: ${e.message}`);
    return {
      firestore: undefined,
      auth: undefined,
      error,
    };
  }
}

/**
 * Gets the initialized Firebase Admin instances (firestore, auth).
 * This function now uses a singleton pattern to ensure initialization
 * happens only once, preventing race conditions.
 *
 * @returns An object containing the admin instances or a captured initialization error.
 */
export function getFirebaseAdmin(): FirebaseAdminInstances | FirebaseAdminError {
  if (!instance) {
    instance = initializeFirebaseAdmin();
  }
  return instance;
}
