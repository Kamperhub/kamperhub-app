
"use client";

import { GoogleMapsPlaceholder } from '@/components/features/map/GoogleMapsPlaceholder';
// When API key is available, you would use:
import { MapView } from '@/components/features/map/MapView';
// APIProvider is now in AppShell


export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Mapping & Navigation</h1>
        <p className="text-muted-foreground font-body mb-6">
          Plan your routes, discover points of interest, and estimate fuel usage for your journey.
        </p>
      </div>
      
      {apiKey ? (
        <MapView />
      ) : (
        <GoogleMapsPlaceholder />
      )}

    </div>
  );
}
