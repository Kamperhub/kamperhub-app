
import admin from 'firebase-admin';

let adminFirestore: admin.firestore.Firestore | null = null;
let firebaseAdminInitError: Error | null = null;

if (!admin.apps.length) {
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (serviceAccountJson) {
    try {
      console.log("[Firebase Admin] Initializing Admin SDK with service account credentials from env var.");
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      adminFirestore = admin.firestore();
    } catch (e: any) {
      console.error("[Firebase Admin] CRITICAL: Firebase Admin SDK initialization failed with provided credentials.", e);
      firebaseAdminInitError = e;
    }
  } else {
    // This is a more defensive approach for local development.
    // Instead of calling initializeApp() and letting it potentially crash,
    // we explicitly set the error state.
    const errorMessage = "Firebase Admin SDK not initialized. The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. Server-side database operations will fail.";
    console.warn(`[Firebase Admin] WARNING: ${errorMessage}`);
    firebaseAdminInitError = new Error(errorMessage);
  }
} else {
  // If the app is already initialized, just get the firestore instance.
  adminFirestore = admin.firestore();
}

export { admin, adminFirestore, firebaseAdminInitError };
