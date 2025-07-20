'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { RouteDetails } from '@/types/tripplanner';

const directionsRequestSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  isTowing: z.boolean(),
  vehicleHeight: z.number().positive().optional(),
  caravanHeight: z.number().positive().optional(),
  axleCount: z.number().int().positive().optional(),
  avoidTolls: z.boolean().optional(),
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
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error("Directions API Error: GOOGLE_API_KEY is not configured on the server.");
    return NextResponse.json({ error: 'The server-side GOOGLE_API_KEY is not configured. This key is required for route calculations and should not have HTTP referrer restrictions. See setup guide.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const parsedBody = directionsRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }

    const { origin, destination, isTowing, vehicleHeight, caravanHeight, axleCount, avoidTolls } = parsedBody.data;

    const finalHeight = isTowing
      ? Math.max(vehicleHeight || 0, caravanHeight || 0)
      : vehicleHeight;
    const finalHeightInMeters = finalHeight && finalHeight > 0 ? finalHeight / 1000 : undefined;


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
    
    const vehicleInfo: any = {};
    if (finalHeightInMeters) {
      vehicleInfo.dimensions = { height: finalHeightInMeters };
    }
    if (axleCount && axleCount > 0) {
      vehicleInfo.axleCount = axleCount;
    }

    const routeModifiers: any = {};
    if (Object.keys(vehicleInfo).length > 0) {
        routeModifiers.vehicleInfo = vehicleInfo;
    }
    if (avoidTolls) {
        routeModifiers.avoidTolls = true;
    }

    if (Object.keys(routeModifiers).length > 0) {
        requestBody.routeModifiers = routeModifiers;
    }
    
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.warnings,routes.polyline.encodedPolyline,routes.legs,routes.travelAdvisory.tollInfo',
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
            if (errorMessage.includes("API has not been used in project")) {
                const apiName = errorMessage.includes("Routes API") ? "Routes API" : "Places API (New)";
                errorMessage = `The Google ${apiName} is not enabled for this project. Please enable it in the Google Cloud Console (see Step 3.5 in the setup guide) and ensure your API key has permissions for it.`;
            } else if (errorMessage.toLowerCase().includes('api_key_not_valid')) {
               errorMessage = "The provided GOOGLE_API_KEY is invalid. Please check the key in your .env.local file.";
            } else if (errorMessage.toLowerCase().includes('invalid json payload')) {
                errorMessage = `The app sent an invalid request to the Google Routes API. ${errorMessage}`;
            }
          }
        } catch(e) {
          if (errorBody.toLowerCase().includes('api key not valid')) {
            errorMessage = "The provided GOOGLE_API_KEY is invalid. Please check the key in your .env.local file and restart the server.";
          } else if (errorBody.toLowerCase().includes('http referrer')) {
            errorMessage = 'The GOOGLE_API_KEY has "HTTP referrer" restrictions. Use a key with "None" or "IP Address" restrictions as explained in the setup guide.';
          }
        }
        
        throw new Error(errorMessage);
    }

    const responseBodyText = await response.text();
    if (!responseBodyText) {
        return NextResponse.json({ error: "No routes found between the specified locations. The destination may be unreachable by car." }, { status: 404 });
    }

    const data = JSON.parse(responseBodyText);
    
    if (!data.routes || data.routes.length === 0) {
        return NextResponse.json({ error: "No routes found between the specified locations. Please check the start and end points." }, { status: 404 });
    }

    const route = data.routes[0];
    const encodedPolyline = route?.polyline?.encodedPolyline;

    const tollInfo = route.travelAdvisory?.tollInfo;
    let adaptedTollInfo = null;

    if (tollInfo?.estimatedPrice?.length > 0) {
        const totalTollCost = tollInfo.estimatedPrice.reduce((sum: number, price: any) => {
        const units = price.units ? parseInt(price.units) : 0;
        const nanos = price.nanos ? price.nanos / 1_000_000_000 : 0;
        return sum + units + nanos;
        }, 0);
        
        if (totalTollCost > 0) {
        adaptedTollInfo = {
            text: `$${totalTollCost.toFixed(2)} (${tollInfo.estimatedPrice[0].currencyCode || 'USD'})`,
            value: totalTollCost
        };
        }
    }

    const adaptedResponse: RouteDetails = {
        distance: { text: `${((route?.distanceMeters || 0) / 1000).toFixed(1)} km`, value: route?.distanceMeters || 0 },
        duration: { text: formatDuration(route?.duration || '0s'), value: parseInt(route?.duration?.slice(0,-1) || '0', 10)},
        startLocation: route?.legs?.[0]?.startLocation?.latLng,
        endLocation: route?.legs?.[(route.legs.length - 1)]?.endLocation?.latLng,
        polyline: encodedPolyline,
        warnings: route?.warnings || [],
        tollInfo: adaptedTollInfo,
    };
    return NextResponse.json(adaptedResponse, { status: 200 });

  } catch (error: any) {
    console.error('Error in directions API route:', error);
    if (error instanceof SyntaxError && error.message.includes("Unexpected token")) {
        return NextResponse.json({ error: `The server received an unexpected response from the mapping service. This can happen with unusual locations. Please try again.`, details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: `Error calculating route: ${error.message}` || 'An internal server error occurred.' }, { status: 500 });
  }
}
