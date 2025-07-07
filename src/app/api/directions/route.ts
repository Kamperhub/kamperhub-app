
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const directionsRequestSchema = z.object({
  origin: z.string(),
  destination: z.string(),
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
  // Use the unrestricted server-side GOOGLE_API_KEY for server-to-server calls
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error("Directions API Error: GOOGLE_API_KEY is not configured on the server.");
    return NextResponse.json({ error: 'The server-side GOOGLE_API_KEY is not configured. This key is required for route calculations. See setup guide.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const parsedBody = directionsRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }

    const { origin, destination } = parsedBody.data;

    // Base request body for Google's Routes API
    const requestBody: any = {
      origin: { address: origin },
      destination: { address: destination },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      languageCode: 'en-US',
      units: 'METRIC',
    };
    
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Google Routes API Error Response Body:", errorBody);
        
        let errorMessage = `Google Routes API request failed with status ${response.status}.`;
        
        try {
          const errorData = JSON.parse(errorBody);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
            if (errorMessage.includes("Routes API has not been used in project")) {
              errorMessage = "The Google Routes API is not enabled for this project. Please enable it in the Google Cloud Console (see Step 3.5 in the setup guide) and ensure your API key has permissions for it.";
            } else if (errorMessage.toLowerCase().includes('api_key_not_valid')) {
               errorMessage = "The provided GOOGLE_API_KEY is invalid. Please check the key in your .env.local file.";
            } else if (errorMessage.toLowerCase().includes('api_key_http_referrer_blocked')) {
                errorMessage = 'The GOOGLE_API_KEY has "HTTP referrer" restrictions, which is not allowed for server-to-server API calls. Use a key with "None" or "IP Address" restrictions as explained in the setup guide.';
            }
          }
        } catch(e) {
          // This block catches if JSON.parse fails, which can happen with non-JSON error responses from proxies etc.
          if (errorBody.toLowerCase().includes('api key not valid')) {
            errorMessage = "The provided GOOGLE_API_KEY is invalid. Please check the key in your .env.local file and restart the server.";
          }
        }
        
        throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
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
    return NextResponse.json({ error: `Error calculating route: ${error.message}` || 'An internal server error occurred.' }, { status: 500 });
  }
}
