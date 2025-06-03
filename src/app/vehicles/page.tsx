import { VehicleForm } from '@/components/features/vehicles/VehicleForm';
import { CaravanForm } from '@/components/features/vehicles/CaravanForm';

export default function VehiclesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Vehicle & Caravan Data</h1>
        <p className="text-muted-foreground font-body mb-6">
          Keep your tow vehicle and caravan specifications up to date for accurate weight calculations and compliance checks.
        </p>
      </div>
      <VehicleForm />
      <CaravanForm />
    </div>
  );
}
