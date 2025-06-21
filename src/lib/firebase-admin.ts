
import admin, { type App as AdminApp, type ServiceAccount } from 'firebase-admin';

let app: AdminApp | undefined = undefined;
let firestore: admin.firestore.Firestore | undefined = undefined;

// This function attempts to parse the service account JSON from the environment variable.
function getServiceAccount(): ServiceAccount | undefined {
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccountJson) {
    console.log('[Firebase Admin] GOOGLE_APPLICATION_CREDENTIALS_JSON env var not found. Will attempt default initialization.');
    return undefined;
  }
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log('[Firebase Admin] Successfully parsed service account from GOOGLE_APPLICATION_CREDENTIALS_JSON.');
    return serviceAccount;
  } catch (e: any) {
    console.error('[Firebase Admin] CRITICAL: Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON.', {
      message: e.message,
      parseError: e,
    });
    return undefined;
  }
}

try {
  if (admin.apps.length > 0) {
    app = admin.app();
    console.log('[Firebase Admin] SDK re-used existing instance.');
  } else {
    const serviceAccount = getServiceAccount();
    if (serviceAccount) {
      // Initialize with explicit credentials if the env var is available and valid.
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase Admin] SDK initialized successfully with explicit credentials from env var.');
    } else {
      // Fallback to default credentials (for managed environments like Cloud Run).
      app = admin.initializeApp();
      console.log('[Firebase Admin] SDK initialized successfully with default credentials (fallback).');
    }
  }

  if (app) {
    firestore = admin.firestore(app);
  } else {
    console.error('[Firebase Admin] CRITICAL: Firebase Admin App was NOT initialized. Firestore client will be undefined.');
  }

} catch (initializationError: any) {
  console.error('[Firebase Admin] CRITICAL ERROR during Firebase Admin SDK initialization:', {
    message: initializationError.message,
    stack: initializationError.stack,
  });
  // app and firestore will remain undefined
}

export { app as adminApp, firestore as adminFirestore, admin };
