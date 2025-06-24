
import admin from 'firebase-admin';

// This new logic prioritizes using a service account JSON from environment variables,
// which is a more robust method for server-side authentication.
const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

if (!admin.apps.length) {
  if (serviceAccountJson) {
    console.log("[Firebase Admin] Initializing Admin SDK with service account credentials from env var.");
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error: any) {
      console.error("[Firebase Admin] CRITICAL: Failed to parse service account JSON from env var.", error);
      // Throw an error to prevent the app from starting with a broken config
      throw new Error("Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON. Please check your environment variables.");
    }
  } else {
    console.warn("[Firebase Admin] WARNING: Initializing with Application Default Credentials. This might fail if not configured correctly. For a more reliable setup, set the GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.");
    try {
      admin.initializeApp();
    } catch (error: any) {
      console.error("[Firebase Admin] CRITICAL: Failed to initialize with Application Default Credentials.", error);
      throw new Error("Firebase Admin SDK initialization failed. Ensure ADC is set up or provide service account JSON in env vars.");
    }
  }
}

const adminFirestore = admin.firestore();

export { admin, adminFirestore };
