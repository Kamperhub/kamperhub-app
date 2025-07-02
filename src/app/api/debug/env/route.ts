
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET() {
  const envVars = {
    // Client-side Firebase Config
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Not Set',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not Set',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Not Set',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Set' : 'Not Set',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Not Set',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Set' : 'Not Set',
    
    // App Check Config
    NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY ? 'Set' : 'Not Set',
    
    // Server-side Firebase Config
    GOOGLE_APPLICATION_CREDENTIALS_JSON: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'Set' : 'Not Set',

    // Stripe Config
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not Set',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not Set',
    STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID ? 'Set' : 'Not Set',

    // Google Maps API Key
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not Set',
  };

  let adminSDKInitializationStatus = 'Not Attempted';
  let serverProjectId = 'Not found in credentials';
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not Set';
  let projectIdsMatch = 'Cannot determine';
  
  // Directly call getFirebaseAdmin to test initialization.
  // This is the most important part of the diagnostic.
  const { error: adminError } = getFirebaseAdmin();
  if (adminError) {
      adminSDKInitializationStatus = `CRITICAL FAILURE: The Admin SDK failed to initialize. This is the most likely cause of API route 404 or other server errors. Exact Error: ${adminError.message}`;
  } else {
      adminSDKInitializationStatus = "SUCCESS: Firebase Admin SDK initialized successfully. Server can connect to Firebase.";
  }
  
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
   if (serviceAccountJsonString) {
    try {
      let jsonString = serviceAccountJsonString.trim();
      if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
        jsonString = jsonString.substring(1, jsonString.length - 1);
      }
      const parsedJson = JSON.parse(jsonString);
      serverProjectId = parsedJson.project_id || 'Not found in credentials JSON';
    } catch(e: any) {
        serverProjectId = `Could not parse credentials JSON. Error: ${e.message}`;
    }
  }

  if (serverProjectId.startsWith('Could not') || serverProjectId.startsWith('Not found')) {
      projectIdsMatch = `Cannot determine: Server Project ID is missing or invalid.`;
  } else if (clientProjectId === 'Not Set') {
      projectIdsMatch = `Cannot determine: Client Project ID is not set.`;
  } else if (serverProjectId === clientProjectId) {
      projectIdsMatch = `Yes - OK. Both client and server are configured for project '${clientProjectId}'.`;
  } else {
      projectIdsMatch = `NO - CRITICAL MISMATCH. Server is for '${serverProjectId}', Client is for '${clientProjectId}'.`;
  }

  return NextResponse.json({
    message: "This endpoint checks the status of critical environment variables on the server.",
    status: {
        ...envVars,
        SERVER_SIDE_PROJECT_ID: serverProjectId,
        CLIENT_SIDE_PROJECT_ID: clientProjectId,
        PROJECT_IDS_MATCH: projectIdsMatch,
        ADMIN_SDK_INITIALIZATION_STATUS: adminSDKInitializationStatus,
    }
  });
}
