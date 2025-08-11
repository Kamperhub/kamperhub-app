// src/app/api/debug/create-admin-user/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * This debug endpoint has been disabled for security reasons.
 * The signup process now handles admin user creation automatically.
 */
export async function GET(req: NextRequest) {
  return new NextResponse(
    JSON.stringify({
      error: 'This endpoint has been disabled for security reasons. The signup process now handles admin user creation automatically.',
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
