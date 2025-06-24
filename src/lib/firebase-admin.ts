
import admin from 'firebase-admin';

let adminFirestore: admin.firestore.Firestore | null = null;
let firebaseAdminInitError: Error | null = null;

if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountJson) {
      console.log("[Firebase Admin] Initializing Admin SDK with service account credentials from env var.");
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn("[Firebase Admin] WARNING: Initializing with Application Default Credentials. This might fail if not configured correctly. For a more reliable setup, set the GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.");
      admin.initializeApp();
    }
    adminFirestore = admin.firestore();
  } catch (e: any) {
    console.error("[Firebase Admin] CRITICAL: Firebase Admin SDK initialization failed.", e);
    firebaseAdminInitError = e;
  }
} else {
  // If the app is already initialized, just get the firestore instance.
  adminFirestore = admin.firestore();
}

export { admin, adminFirestore, firebaseAdminInitError };
