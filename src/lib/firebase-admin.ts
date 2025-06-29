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

    // The JSON string from the environment variable should be parsed directly.
    // The .replace() call was incorrect and caused parsing errors.
    const serviceAccount = JSON.parse(serviceAccountJsonString);

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
