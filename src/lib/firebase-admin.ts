
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
  if (admin.apps.length) {
    console.log("[Firebase Admin] Re-using existing initialized app.");
    return {
      firestore: admin.firestore(),
      auth: admin.auth(),
      error: null,
    };
  }

  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  // Per your instructions, explicitly check for the env var first.
  if (!serviceAccountJsonString) {
    const errorMessage = "FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. The server cannot connect to Firebase services. Please follow the setup checklist.";
    console.error(`[Firebase Admin] ${errorMessage}`);
    return {
      firestore: undefined,
      auth: undefined,
      error: new Error(errorMessage),
    };
  }

  try {
    let jsonString = serviceAccountJsonString.trim();
    // Handle cases where the string might be wrapped in single or double quotes.
    if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
      jsonString = jsonString.substring(1, jsonString.length - 1);
    }
    
    const serviceAccount = JSON.parse(jsonString);
    
    // This is a common issue with .env files, so explicitly handle it.
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
    const errorMessage = `Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's valid, unescaped JSON on a single line. The server sees: "${errorSnippet}...". Original error: ${e.message}`;
    console.error(`[Firebase Admin] ${errorMessage}`);
    return {
      firestore: undefined,
      auth: undefined,
      error: new Error(errorMessage),
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
  // If the instance exists AND it had an error, force a re-initialization attempt.
  // This allows for recovery without a full server restart in some environments,
  // though a restart is still the recommended approach after fixing env vars.
  if (!instance || instance.error) {
    console.log(`[Firebase Admin] Attempting to initialize... (Previous state: ${instance ? 'Error' : 'Not Initialized'})`);
    instance = initializeFirebaseAdmin();
  }
  return instance;
}
