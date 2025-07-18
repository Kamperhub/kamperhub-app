
export interface InventoryItem {
  id: string;
  name: string;
  weight: number; // in kg, weight of a single unit
  quantity: number; // number of units
  locationId?: string | null; // ID of the storage location from the caravan
}

export interface CaravanWeightData {
  tareMass: number; // kg, from CaravanForm
  atm: number; // kg, Aggregate Trailer Mass, from CaravanForm
  gtm: number; // kg, Gross Trailer Mass, from CaravanForm
  maxTowballDownload: number; // kg, from CaravanForm
  numberOfAxles: number; // New field from CaravanForm
  make?: string; // Optional: for display purposes on inventory page
  model?: string; // Optional: for display purposes on inventory page
}

export type CaravanInventories = Record<string, InventoryItem[]>;


// Mock data, in a real app this would come from user input / storage
export const mockCaravanWeightData: CaravanWeightData = {
  tareMass: 1800,
  atm: 2500,
  gtm: 2350,
  maxTowballDownload: 250,
  numberOfAxles: 1,
  make: "MockMake",
  model: "MockModel"
};
