
import admin from 'firebase-admin';

let initError: Error | null = null;
let firestore: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

// This check ensures that Firebase is only initialized once.
// In a serverless environment, this code may run multiple times, but `initializeApp`
// should only be called if no apps are already initialized.
if (!admin.apps.length) {
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (serviceAccountJson) {
    try {
      // This line programmatically fixes the escaped newlines in the private key.
      const correctedServiceAccountJson = serviceAccountJson.replace(/\\n/g, '\n');
      const serviceAccount = JSON.parse(correctedServiceAccountJson);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("[Firebase Admin] SDK initialized successfully.");
    } catch (e: any) {
      const jsonSnippet = serviceAccountJson.substring(0, 75).replace(/\s/g, '');
      initError = new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Ensure it's valid JSON on a single line. Server sees: "${jsonSnippet}...". Original error: ${e.message}`);
      console.error("[Firebase Admin] CRITICAL:", initError.message);
    }
  } else {
    initError = new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. Please follow the setup checklist.");
    console.error(`[Firebase Admin] CRITICAL: ${initError.message}`);
  }
}

// Assign the instances only if initialization succeeded.
if (admin.apps.length > 0) {
  firestore = admin.firestore();
  auth = admin.auth();
}

/**
 * Gets the initialized Firebase Admin instances (firestore, auth).
 * This function now acts as a getter for the singleton instances initialized above.
 * It returns an error if the initial initialization failed.
 *
 * @returns An object containing the admin instances or an error.
 */
export function getFirebaseAdmin() {
  if (initError) {
    return { firestore: undefined, auth: undefined, error: initError };
  }
  
  // This condition handles the case where initialization didn't error but didn't succeed either.
  if (!firestore || !auth) {
    return { firestore: undefined, auth: undefined, error: new Error("Firebase Admin SDK not available. Check server logs for initialization errors.") };
  }

  return { firestore, auth, error: null };
}
