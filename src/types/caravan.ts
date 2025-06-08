
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
  overallLength?: number | null; // New: Overall length in mm (incl. drawbar)
  bodyLength?: number | null; // New: Caravan body length in mm
  overallHeight?: number | null; // New: Overall height from ground in mm
  hitchToAxleCenterDistance?: number | null; // New: Distance from coupling to center of axle group in mm
  interAxleSpacing?: number | null; // New: Distance between consecutive axles if multi-axle (mm)
}

export interface StoredCaravan extends CaravanFormData {
  id: string;
}

export const CARAVANS_STORAGE_KEY = 'kamperhub_caravans_list';
export const ACTIVE_CARAVAN_ID_KEY = 'kamperhub_active_caravan_id';
