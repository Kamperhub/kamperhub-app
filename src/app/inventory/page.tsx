import { InventoryList } from '@/components/features/inventory/InventoryList';
import { mockCaravanWeightData } from '@/types/inventory'; // Using mock data for now

export default function InventoryPage() {
  // In a real app, caravanSpecs would be fetched or come from global state / user input
  const caravanSpecs = mockCaravanWeightData;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Inventory & Weight Management</h1>
        <p className="text-muted-foreground font-body mb-6">
          Track your caravan's load, manage items, and stay compliant with weight limits.
          The data below uses example caravan specifications. Update your caravan details in the 'Vehicles' section for accurate calculations.
        </p>
      </div>
      <InventoryList caravanSpecs={caravanSpecs} />
    </div>
  );
}
