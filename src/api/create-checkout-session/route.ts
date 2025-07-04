
import { NextResponse } from 'next/server';

/**
 * This API endpoint has been replaced by a direct Stripe Payment Link for simplicity and reliability.
 * It is no longer used by the application and is kept here for reference only.
 * Please configure the NEXT_PUBLIC_STRIPE_PAYMENT_LINK in your .env.local file.
 */
export async function POST() {
  return NextResponse.json(
    { 
      error: 'This endpoint is obsolete. Use Stripe Payment Links instead.',
      details: 'The application now uses a direct link to a Stripe Payment Link. This API endpoint for creating checkout sessions is no longer needed.' 
    }, 
    { status: 410 } // 410 Gone
  );
}
