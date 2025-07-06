'use server';

import type { RouteDetails } from '@/types/tripplanner';
import { z } from 'zod';

const directionsRequestSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  vehicleHeight: z.number().positive().optional(),
});

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

export async function calculateRoute(origin: string, destination: string, vehicleHeight?: number): Promise<RouteDetails> {
  // Use the server-side GOOGLE_API_KEY, which should not have HTTP referrer restrictions.
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('Server-side GOOGLE_API_KEY is not configured. This key is required for route calculations and should not have HTTP referrer restrictions. See setup guide.');
  }

  const parsedBody = directionsRequestSchema.safeParse({ origin, destination, vehicleHeight });

  if (!parsedBody.success) {
    throw new Error('Invalid arguments for route calculation.');
  }

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
      const adaptedResponse: RouteDetails = {
          distance: { text: `${(route.distanceMeters / 1000).toFixed(1)} km`, value: route.distanceMeters },
          duration: { text: formatDuration(route.duration), value: parseInt(route.duration.slice(0,-1), 10)},
          startLocation: route.legs[0]?.startLocation?.latLng,
          endLocation: route.legs[0]?.endLocation?.latLng,
          polyline: route.polyline.encodedPolyline,
          warnings: route.warnings || [],
      };
      return adaptedResponse;
  } else {
      throw new Error("No routes found for the given locations.");
  }
}
