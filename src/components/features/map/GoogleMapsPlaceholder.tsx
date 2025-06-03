import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export function GoogleMapsPlaceholder() {
  return (
    <Card className="border-dashed border-accent">
      <CardHeader>
        <CardTitle className="font-headline text-accent flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2" />
          Map Feature Placeholder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-body text-lg mb-4">
          The interactive map and navigation features will be available here.
        </p>
        <p className="font-body text-muted-foreground">
          To enable Google Maps functionality, a Google Maps JavaScript API key needs to be configured in the application.
          Please refer to the documentation for setup instructions.
        </p>
        <div className="mt-6 p-4 bg-muted rounded-md">
          <h4 className="font-headline text-md mb-2">Developer Note:</h4>
          <p className="font-body text-sm">
            Integration with <code>@vis.gl/react-google-maps</code> will provide:
          </p>
          <ul className="list-disc list-inside text-sm font-body mt-1 space-y-1">
            <li>Displaying current location and points of interest.</li>
            <li>Basic route planning visualization (conceptual).</li>
            <li>Placeholder for fuel usage estimation logic.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
