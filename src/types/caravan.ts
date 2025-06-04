
export interface CaravanFormData {
  make: string;
  model: string;
  year: number;
  tareMass: number; // Empty weight
  atm: number; // Aggregate Trailer Mass
  gtm: number; // Gross Trailer Mass
  maxTowballDownload: number;
}

export interface StoredCaravan extends CaravanFormData {
  id: string;
}
