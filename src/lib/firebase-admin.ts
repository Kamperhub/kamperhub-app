
import admin from 'firebase-admin';

let initError: Error | null = null;
let firestore: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

// This check ensures that Firebase is only initialized once.
if (!admin.apps.length) {
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (serviceAccountJsonString) {
    try {
      // Step 1: Trim whitespace from the start and end of the string.
      let json = serviceAccountJsonString.trim();

      // Step 2: Handle if the whole string is wrapped in single or double quotes,
      // which is a common error when copying from .env files.
      if ((json.startsWith("'") && json.endsWith("'")) || (json.startsWith('"') && json.endsWith('"'))) {
        json = json.substring(1, json.length - 1);
      }
      
      // Step 3: Replace the escaped newline characters `\\n` with actual newlines `\n`.
      // This is the most critical step for the PEM private key to be parsed correctly.
      const correctedJson = json.replace(/\\n/g, '\n');

      // Step 4: Parse the corrected and sanitized string into a JSON object.
      const serviceAccount = JSON.parse(correctedJson);

      // Step 5: Initialize Firebase Admin with the parsed credentials.
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("[Firebase Admin] SDK initialized successfully.");

    } catch (e: any) {
      const errorSnippet = (serviceAccountJsonString || "undefined").substring(0, 75).replace(/\s/g, '');
      initError = new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's valid, unescaped JSON on a single line. Server sees: "${errorSnippet}...". Original error: ${e.message}`);
      console.error("[Firebase Admin] CRITICAL:", initError.message);
    }
  } else {
    initError = new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. Please follow the setup checklist.");
    console.error(`[Firebase Admin] CRITICAL: ${initError.message}`);
  }
}

// Assign the instances only if initialization succeeded.
if (admin.apps.length > 0 && !initError) {
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
