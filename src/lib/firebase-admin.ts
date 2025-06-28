
import admin from 'firebase-admin';

// This guard prevents re-initialization, a common issue in serverless environments.
if (!admin.apps.length) {
  try {
    const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!serviceAccountJsonString) {
      // This will be caught by the try-catch and logged during server startup.
      throw new Error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. The server cannot connect to Firebase services.");
    }
    
    // The replace() is crucial for environment variables stored as a single line string.
    const serviceAccount = JSON.parse(
      serviceAccountJsonString.replace(/\\n/g, '\n')
    );
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log(`[Firebase Admin] SDK initialized successfully for project: ${serviceAccount.project_id}`);

  } catch (error: any) {
    // Log a more helpful error that will appear in the server logs.
    // This makes diagnosing setup issues much easier.
    console.error("CRITICAL: Firebase Admin SDK initialization failed. This is likely due to a malformed GOOGLE_APPLICATION_CREDENTIALS_JSON in your .env.local file. Please check that it is a valid, single-line JSON string. Error:", error.message);
    
    // By not throwing here, we allow the server to start but API calls will fail,
    // which is better than a complete startup crash for debugging.
  }
}

// We export the initialized instances.
// If initialization failed, any attempt to use these will throw a runtime error,
// clearly indicating a critical configuration problem.
const firestore = admin.firestore();
const auth = admin.auth();

export { firestore, auth };
