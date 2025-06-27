import admin from 'firebase-admin';

let app: admin.app.App | undefined;
let firestore: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;
let initError: Error | null = null;
let isInitializing = false;

function initializeFirebaseAdmin() {
  // Prevent multiple initializations, especially during concurrent requests
  if (app || isInitializing) {
    return;
  }
  isInitializing = true;

  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccountJson) {
    initError = new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. Please follow the setup checklist.");
    console.error(`[Firebase Admin] CRITICAL: ${initError.message}`);
    isInitializing = false;
    return;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log("[Firebase Admin] Initializing Admin SDK...");
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firestore = admin.firestore();
    auth = admin.auth();
    console.log("[Firebase Admin] SDK initialized successfully.");
  } catch (e: any) {
    const jsonSnippet = serviceAccountJson.substring(0, 75).replace(/\s/g, ''); // Get a snippet for logging without newlines
    const detailedError = new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's valid JSON copied into a single line in your .env.local file. The server sees a value starting with: "${jsonSnippet}...". Original parser error: ${e.message}`);
    
    console.error("[Firebase Admin] CRITICAL: Firebase Admin SDK initialization failed.", detailedError);
    initError = detailedError;
  } finally {
    isInitializing = false;
  }
}

/**
 * Gets the initialized Firebase Admin instances (app, firestore, auth).
 * It initializes the SDK on the first call and caches the instances for subsequent calls.
 * If initialization fails, it returns an error object.
 * This approach prevents server crashes from misconfiguration by deferring initialization
 * and centralizing error handling.
 *
 * @returns An object containing the admin instances or an error.
 */
export function getFirebaseAdmin() {
  if (!app && !initError) {
    initializeFirebaseAdmin();
  }

  if (initError) {
    return { app: undefined, firestore: undefined, auth: undefined, error: initError };
  }
  
  if (!app || !firestore || !auth) {
    // This case covers a scenario where initialization logic might not have completed yet for concurrent requests
    // but before an error is set. Returning an error prompts the client to retry.
    return { app: undefined, firestore: undefined, auth: undefined, error: new Error("Firebase Admin SDK is still initializing or has failed silently. Please try again.") };
  }

  return { app, firestore, auth, error: null };
}
