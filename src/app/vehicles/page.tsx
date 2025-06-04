
import { VehicleManager } from '@/components/features/vehicles/VehicleManager';
import { CaravanManager } from '@/components/features/vehicles/CaravanManager';

export default function VehiclesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Vehicle & Caravan Data</h1>
        <p className="text-muted-foreground font-body mb-6">
          Manage your tow vehicles and caravans. Set one of each as active for use in trip planning and inventory calculations.
        </p>
      </div>
      <VehicleManager />
      <CaravanManager />
    </div>
  );
}
