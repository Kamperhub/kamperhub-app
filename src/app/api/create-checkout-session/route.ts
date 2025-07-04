
import { NextResponse } from 'next/server';

/**
 * This API endpoint is obsolete and has been replaced by a direct Stripe Payment Link.
 * It is kept here to gracefully handle requests from cached versions of the old client code.
 */
export async function POST() {
  return NextResponse.json(
    { 
      error: 'Application Updated: Please Refresh',
      details: 'The subscription process has been updated. Please refresh your browser page to get the latest version and try again.' 
    }, 
    { status: 400 } // Use 400 Bad Request to ensure the client-side catch block is triggered.
  );
}
