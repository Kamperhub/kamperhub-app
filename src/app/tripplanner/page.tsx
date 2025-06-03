
"use client"; 

import { TripPlannerClient } from '@/components/features/tripplanner/TripPlannerClient';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

export default function TripPlannerPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary">Trip Planner</h1>
        <p className="text-muted-foreground font-body mb-6">
          Plan your next adventure! Enter your start and end locations, along with vehicle details, to estimate route distance, time, and fuel costs.
        </p>
      </div>
      
      {apiKey ? (
        <APIProvider apiKey={apiKey} solutionChannel="GMP_visgl_rgm_reactfirebase_v1">
          <TripPlannerClient />
        </APIProvider>
      ) : (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-headline">Google Maps API Key Missing</AlertTitle>
          <AlertDescription className="font-body">
            The Trip Planner requires a Google Maps API key to function. Please configure it in your environment variables (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
            Without it, map and routing features will be unavailable.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
