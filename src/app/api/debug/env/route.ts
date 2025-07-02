
import { NextRequest, NextResponse } from 'next/server';

/**
 * This debug endpoint has been disabled for security reasons.
 * It is not needed for a production application.
 */
export async function GET(req: NextRequest) {
  return new NextResponse(
    JSON.stringify({
      error: 'This endpoint has been disabled for security reasons.',
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
