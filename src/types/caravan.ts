
export interface StorageLocation {
  id: string;
  name: string;
  longitudinalPosition: 'front-of-axles' | 'over-axles' | 'rear-of-axles';
  lateralPosition: 'left' | 'center' | 'right';
}

export interface CaravanFormData {
  make: string;
  model: string;
  year: number;
  tareMass: number; // Empty weight
  atm: number; // Aggregate Trailer Mass
  gtm: number; // Gross Trailer Mass
  maxTowballDownload: number;
  numberOfAxles: number;
  associatedWdhId?: string | null; // ID of the associated WDH
  overallLength?: number | null;
  bodyLength?: number | null;
  overallHeight?: number | null;
  hitchToAxleCenterDistance?: number | null;
  interAxleSpacing?: number | null;
  storageLocations?: StorageLocation[];
}

export interface StoredCaravan extends CaravanFormData {
  id: string;
}

export const CARAVANS_STORAGE_KEY = 'kamperhub_caravans_list';
export const ACTIVE_CARAVAN_ID_KEY = 'kamperhub_active_caravan_id';
