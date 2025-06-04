
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

export const CARAVANS_STORAGE_KEY = 'kamperhub_caravans_list';
export const ACTIVE_CARAVAN_ID_KEY = 'kamperhub_active_caravan_id';
