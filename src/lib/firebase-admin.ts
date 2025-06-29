import admin from 'firebase-admin';

// This function safely initializes the Firebase Admin SDK.
// It ensures that initialization only happens once.
export function getFirebaseAdmin() {
  // First, let's check if an app has already been initialized.
  // If it has, we can simply return the existing services,
  // making sure to get the Firestore instance with the specific databaseId.
  if (admin.apps.length > 0 && admin.apps[0]) {
    // If the app is already initialized, ensure we're returning the Firestore
    // instance configured for 'kamperhubv2'.
    // If you're only ever using 'kamperhubv2' for Firestore, this is safe.
    return {
      auth: admin.auth(),
      firestore: admin.firestore({ databaseId: 'kamperhubv2' }), // <--- CRITICAL CHANGE HERE
      error: null
    };
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

    // --- ANOTHER CRITICAL CHANGE HERE ---
    // After initialization, when we get the firestore instance,
    // we explicitly tell it to connect to 'kamperhubv2'.
    return {
      auth: admin.auth(),
      firestore: admin.firestore({ databaseId: 'kamperhubv2' }), // <--- CRITICAL CHANGE HERE
      error: null
    };

  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin SDK initialization failed.", error.message);
    // Return the error so the API route can handle it gracefully.
    return { auth: null, firestore: null, error };
  }
}
