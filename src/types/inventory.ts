export interface InventoryItem {
  id: string;
  name: string;
  weight: number; // in kg
  category: string;
}

export interface CaravanWeightData {
  tareMass: number; // kg, from CaravanForm
  atm: number; // kg, Aggregate Trailer Mass, from CaravanForm
  gtm: number; // kg, Gross Trailer Mass, from CaravanForm
  maxTowballDownload: number; // kg, from CaravanForm
}

// Mock data, in a real app this would come from user input / storage
export const mockCaravanWeightData: CaravanWeightData = {
  tareMass: 1800,
  atm: 2500,
  gtm: 2350,
  maxTowballDownload: 250,
};
