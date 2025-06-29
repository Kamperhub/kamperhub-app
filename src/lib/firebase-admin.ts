
import admin from 'firebase-admin';

// This function safely initializes the Firebase Admin SDK.
// It ensures that initialization only happens once.
export function getFirebaseAdmin() {
  if (admin.apps.length > 0 && admin.apps[0]) {
    return { auth: admin.auth(), firestore: admin.firestore(), error: null };
  }

  try {
    const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!serviceAccountJsonString) {
      throw new Error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. The server cannot connect to Firebase services.");
    }

    // Safely trim and remove quotes from the env variable string before parsing.
    let jsonString = serviceAccountJsonString.trim();
    if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
        jsonString = jsonString.substring(1, jsonString.length - 1);
    }
    
    const serviceAccount = JSON.parse(jsonString);

    // FIX: The private key in .env files often has its newlines escaped.
    // This line replaces the literal `\\n` with actual newline characters.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log(`[Firebase Admin] SDK initialized successfully for project: ${serviceAccount.project_id}`);
    
    return { auth: admin.auth(), firestore: admin.firestore(), error: null };

  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin SDK initialization failed.", error.message);
    // Return the error so the API route can handle it gracefully.
    return { auth: null, firestore: null, error };
  }
}
