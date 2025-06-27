
import { NextResponse } from 'next/server';

// Note: We are deliberately NOT importing from firebase-admin here to make this endpoint
// as resilient as possible. If firebase-admin fails to initialize, this endpoint should still work.

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
    NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN: process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN ? 'Set' : 'Not Set',
    
    // Server-side Firebase Config
    GOOGLE_APPLICATION_CREDENTIALS_JSON: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'Set' : 'Not Set',

    // Stripe Config
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not Set',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not Set',
    STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID ? 'Set' : 'Not Set',

    // Google Maps API Key
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not Set',
  };

  // Safely check the admin credentials without trying to initialize the whole SDK
  let adminSDKStatus = 'Not Checked';
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (serviceAccountJsonString) {
    try {
      const parsedJson = JSON.parse(serviceAccountJsonString);
      if (parsedJson.project_id && parsedJson.private_key && parsedJson.client_email) {
        adminSDKStatus = 'Set and appears to be valid JSON with key fields present.';
      } else {
        adminSDKStatus = 'Error: The JSON is valid, but it is missing required fields like project_id, private_key, or client_email. Please ensure you have copied the entire service account file content.';
      }
    } catch (e: any) {
      adminSDKStatus = `CRITICAL ERROR: The GOOGLE_APPLICATION_CREDENTIALS_JSON is set, but it is NOT valid JSON. This is the most common cause of server errors. Please ensure it is copied correctly and on a single line. Parser error: ${e.message}`;
    }
  } else {
    adminSDKStatus = 'Error: The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is missing.';
  }


  return NextResponse.json({
    message: "This endpoint checks the status of environment variables on the server. 'Set' means the variable is present. 'Not Set' means it is missing. If a NEXT_PUBLIC_ variable is 'Not Set' here, it will also be missing on the client.",
    status: {
        ...envVars,
        FIREBASE_ADMIN_SDK_STATUS: adminSDKStatus,
    }
  });
}
