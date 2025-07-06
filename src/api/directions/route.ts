
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateRoute } from '@/lib/google-maps-api';

const directionsRequestSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  vehicleHeight: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedBody = directionsRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }

    const { origin, destination, vehicleHeight } = parsedBody.data;

    const routeData = await calculateRoute(origin, destination, vehicleHeight);
    
    return NextResponse.json(routeData, { status: 200 });

  } catch (error: any) {
    console.error('Error in directions API route:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
