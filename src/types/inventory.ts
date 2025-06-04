
export interface InventoryItem {
  id: string;
  name: string;
  weight: number; // in kg, weight of a single unit
  quantity: number; // number of units
}

export interface CaravanWeightData {
  tareMass: number; // kg, from CaravanForm
  atm: number; // kg, Aggregate Trailer Mass, from CaravanForm
  gtm: number; // kg, Gross Trailer Mass, from CaravanForm
  maxTowballDownload: number; // kg, from CaravanForm
}

// Key for storing inventories for multiple caravans
// The structure will be Record<caravanId, InventoryItem[]>
export const INVENTORY_STORAGE_KEY = 'kamperhub_caravan_inventories';

export type CaravanInventories = Record<string, InventoryItem[]>;


// Mock data, in a real app this would come from user input / storage
export const mockCaravanWeightData: CaravanWeightData = {
  tareMass: 1800,
  atm: 2500,
  gtm: 2350,
  maxTowballDownload: 250,
};
