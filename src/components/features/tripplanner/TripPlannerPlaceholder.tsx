
// This component is no longer used as the Trip Planner functionality
// has been implemented in TripPlannerClient.tsx and tripplanner/page.tsx.
// It can be safely deleted.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Route, Construction } from 'lucide-react';

export function TripPlannerPlaceholder() {
  return (
    <Card className="border-dashed border-accent">
      <CardHeader>
        <CardTitle className="font-headline text-accent flex items-center">
          <Construction className="w-6 h-6 mr-2" />
          Trip Planner - Coming Soon!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-body text-lg mb-4">
          We're working hard to bring you an amazing trip planning experience.
        </p>
        <p className="font-body text-muted-foreground">
          Soon, you'll be able to:
        </p>
        <ul className="list-disc list-inside text-muted-foreground font-body mt-2 space-y-1">
          <li>Create multi-stop itineraries.</li>
          <li>Discover points of interest and campsites along your route.</li>
          <li>Save and share your travel plans.</li>
          <li>Get AI-powered suggestions for activities and stops.</li>
        </ul>
        <div className="mt-6 p-4 bg-muted rounded-md flex items-center justify-center">
          <Route className="w-16 h-16 text-primary opacity-30" />
        </div>
      </CardContent>
    </Card>
  );
}
