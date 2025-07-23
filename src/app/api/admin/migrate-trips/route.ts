
import { NextResponse } from 'next/server';

/**
 * This API endpoint has been disabled as the data migration it performed is no longer needed.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint Disabled', details: 'This data migration tool has been removed.' },
    { status: 404 }
  );
}
