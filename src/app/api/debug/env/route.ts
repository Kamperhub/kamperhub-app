
import { NextResponse } from 'next/server';

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

    // Google Maps API Key
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not Set',
  };

  return NextResponse.json({
    message: "This endpoint checks the status of environment variables on the server. 'Set' means the variable is present. 'Not Set' means it is missing. If a NEXT_PUBLIC_ variable is 'Not Set' here, it will also be missing on the client.",
    status: envVars
  });
}
