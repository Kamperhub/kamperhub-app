
import 'server-only';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export function getFirebaseAdmin() {
  if (admin.apps.length > 0 && admin.apps[0]) {
    const app = admin.apps[0];
    const firestore = getFirestore(app, 'kamperhubv2');
    if (!firestore) {
      const error = new Error("FATAL: Failed to get Firestore instance for database 'kamperhubv2'. Please ensure a Firestore database with this exact ID exists in your Firebase project.");
      console.error("CRITICAL: Firebase Admin SDK initialization failed.", error);
      return { auth: null, firestore: null, error };
    }
    return {
      auth: admin.auth(app),
      firestore: firestore,
      error: null
    };
  }

  try {
    console.log("[Firebase Admin] No initialized app found. Starting new initialization with Base64 credentials...");
    const serviceAccountBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!serviceAccountBase64) {
      throw new Error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. The server cannot connect to Firebase services. Please follow the setup guide to provide the Base64 encoded service account key.");
    }
    
    if (!clientProjectId) {
        throw new Error("FATAL: NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not set. Cannot verify server-side configuration.");
    }
    
    let serviceAccount;
    try {
        const decodedJsonString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedJsonString);
    } catch (e: any) {
        throw new Error(`FATAL: The GOOGLE_APPLICATION_CREDENTIALS_JSON string in your .env.local file could not be decoded from Base64 or parsed as JSON. Please ensure it is a valid, single-line Base64 string. Error: ${e.message}`);
    }

    if (serviceAccount.project_id !== clientProjectId) {
        throw new Error(`FATAL: Project ID Mismatch. Server key is for project '${serviceAccount.project_id}', but client keys are for project '${clientProjectId}'. All keys in your .env.local file MUST come from the same Firebase project.`);
    }

    if (!serviceAccount.private_key) {
      throw new Error("FATAL: The 'private_key' field is missing from your decoded service account JSON. The Base64 string may be corrupted or from an invalid file.");
    }
    
    const newApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log(`[Firebase Admin] SDK initialized successfully for project: ${serviceAccount.project_id}`);
    
    const firestore = getFirestore(newApp, 'kamperhubv2');
    if (!firestore) {
      throw new Error("FATAL: Failed to get Firestore instance for database 'kamperhubv2' after initializing a new app. Please ensure a Firestore database with this exact ID exists.");
    }

    return {
      auth: admin.auth(newApp),
      firestore: firestore,
      error: null
    };

  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin SDK initialization failed.", error);
    return { auth: null, firestore: null, error };
  }
}
