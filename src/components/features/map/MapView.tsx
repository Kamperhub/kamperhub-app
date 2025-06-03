
"use client";

import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';

// A basic MapView component
export function MapView() {
  const [center, setCenter] = useState({ lat: -33.8688, lng: 151.2093 }); // Default to Sydney

  useEffect(() => {
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Error getting user location, defaulting to Sydney:", error);
          // Stick to default if permission denied or error
        }
      );
    }
  }, []);

  return (
    <Card className="shadow-xl">
      <CardContent className="p-0 h-[600px] w-full rounded-lg overflow-hidden">
        <Map
          defaultCenter={center}
          center={center}
          defaultZoom={13}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId="kamperhub-map" // Optional: for cloud-based map styling
          className="h-full w-full"
        >
          <AdvancedMarker position={center}>
            <Pin borderColor={'var(--primary)'} glyphColor={'var(--primary)'} background={'var(--accent)'} />
          </AdvancedMarker>
        </Map>
      </CardContent>
    </Card>
  );
}
