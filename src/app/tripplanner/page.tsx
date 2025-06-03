
import { TripPlannerPlaceholder } from '@/components/features/tripplanner/TripPlannerPlaceholder';

export default function TripPlannerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Trip Planner</h1>
        <p className="text-muted-foreground font-body mb-6">
          Plan your next adventure! This feature will help you create itineraries, find campsites, estimate travel times, and more.
          Stay tuned for exciting updates.
        </p>
      </div>
      <TripPlannerPlaceholder />
    </div>
  );
}
