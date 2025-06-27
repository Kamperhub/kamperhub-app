import admin from 'firebase-admin';

let app: admin.app.App | undefined;
let firestore: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;
let initError: Error | null = null;

function initializeFirebaseAdmin() {
  // This function should only be called once.
  if (app) {
    return;
  }

  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccountJson) {
    initError = new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. Please follow the setup checklist.");
    console.error(`[Firebase Admin] CRITICAL: ${initError.message}`);
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
    console.error("[Firebase Admin] CRITICAL: Firebase Admin SDK initialization failed due to invalid JSON credentials.", e);
    initError = new Error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's valid JSON copied into a single line in your .env.local file.");
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
  // Run initialization only once.
  if (!app && !initError) {
    initializeFirebaseAdmin();
  }

  if (initError) {
    return { app: undefined, firestore: undefined, auth: undefined, error: initError };
  }
  
  // After a successful init, these should be defined.
  // The check is for type safety.
  if (!app || !firestore || !auth) {
    // This case should ideally not be reached if initError is null, but it's a safe fallback.
    return { app: undefined, firestore: undefined, auth: undefined, error: new Error("Firebase Admin SDK not initialized despite no init error.") };
  }

  return { app, firestore, auth, error: null };
}
