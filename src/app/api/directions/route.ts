
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const directionsRequestSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  vehicleHeight: z.number().positive().optional(),
});

// Helper to format ISO 8601 duration string (e.g., "3600s") into human-readable format
function formatDuration(isoDuration: string): string {
    const seconds = parseInt(isoDuration.slice(0, -1), 10);
    if (isNaN(seconds) || seconds < 0) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(' ') : 'Less than a minute';
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key is not configured on the server.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const parsedBody = directionsRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }

    const { origin, destination, vehicleHeight } = parsedBody.data;

    // Base request body for Google's Routes API
    const requestBody: any = {
      origin: { address: origin },
      destination: { address: destination },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      extraComputations: ['TOLLS'],
      languageCode: 'en-US',
      units: 'METRIC',
      polylineEncoding: 'ENCODED_POLYLINE',
    };

    // If height is provided, add it to the request to check for restrictions
    if (vehicleHeight && vehicleHeight > 0) {
      requestBody.routeModifiers = {
        vehicleInfo: {
            height: `${vehicleHeight}m`,
        },
      };
    }
    
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            // Field mask to request specific fields, reducing data transfer and cost
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.warnings,routes.polyline.encodedPolyline,routes.legs(startLocation,endLocation)',
        },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Google Routes API Error:", data);
        let errorMessage = "Failed to calculate route from Google Routes API.";
        if (data.error?.message) {
            errorMessage = data.error.message;
            if (errorMessage.includes("Routes API has not been used in project")) {
                errorMessage = "The Google Routes API is not enabled for this project. Please enable it in the Google Cloud Console and ensure your API key has permissions for it.";
            }
        }
        throw new Error(errorMessage);
    }
    
    if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Adapt the response to a simpler structure for the client
        const adaptedResponse = {
            distance: { text: `${(route.distanceMeters / 1000).toFixed(1)} km`, value: route.distanceMeters },
            duration: { text: formatDuration(route.duration), value: parseInt(route.duration.slice(0,-1), 10)},
            startLocation: route.legs[0]?.startLocation?.latLng,
            endLocation: route.legs[0]?.endLocation?.latLng,
            polyline: route.polyline.encodedPolyline,
            warnings: route.warnings || [],
        };
        return NextResponse.json(adaptedResponse, { status: 200 });
    } else {
        return NextResponse.json({ error: "No routes found." }, { status: 404 });
    }

  } catch (error: any) {
    console.error('Error in directions API route:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
