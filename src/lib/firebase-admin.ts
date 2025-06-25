
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
      console.error("[Firebase Admin] CRITICAL: Firebase Admin SDK initialization failed. The provided GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON.", e);
      firebaseAdminInitError = new Error("Firebase Admin SDK failed: The provided GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable contains invalid JSON. Please re-copy the contents of your service account key file.");
    }
  } else {
    const errorMessage = "Firebase Admin SDK not initialized. The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. Please follow Step 4 in FIREBASE_SETUP_CHECKLIST.md to configure your local credentials in a .env.local file.";
    console.error(`[Firebase Admin] CRITICAL: ${errorMessage}`);
    firebaseAdminInitError = new Error(errorMessage);
  }
} else {
  // If the app is already initialized, just get the firestore instance.
  adminFirestore = admin.firestore();
}

export { admin, adminFirestore, firebaseAdminInitError };
