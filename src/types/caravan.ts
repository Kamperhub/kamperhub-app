
export interface StorageLocation {
  id: string;
  name: string;
  longitudinalPosition: 'front-of-axles' | 'over-axles' | 'rear-of-axles';
  lateralPosition: 'left' | 'center' | 'right';
  distanceFromAxleCenterMm?: number | null; 
  distanceFromCenterlineMm?: number | null;
  heightFromGroundMm?: number | null;
  maxWeightCapacityKg?: number | null;
}

export interface WaterTank {
  id: string;
  name: string; 
  type: 'fresh' | 'grey' | 'black';
  capacityLiters: number;
  longitudinalPosition: 'front-of-axles' | 'over-axles' | 'rear-of-axles';
  lateralPosition: 'left' | 'center' | 'right';
  distanceFromAxleCenterMm?: number | null;
}

export interface CaravanFormData {
  make: string;
  model: string;
  year: number;
  tareMass: number; 
  atm: number; 
  gtm: number; 
  maxTowballDownload: number;
  numberOfAxles: number;
  associatedWdhId?: string | null; 
  overallLength?: number | null;
  bodyLength?: number | null;
  overallHeight?: number | null;
  hitchToAxleCenterDistance?: number | null;
  interAxleSpacing?: number | null;
  storageLocations?: StorageLocation[];
  waterTanks?: WaterTank[];
}

export interface StoredCaravan extends CaravanFormData {
  id: string;
}

export const CARAVANS_STORAGE_KEY = 'kamperhub_caravans_list';
export const ACTIVE_CARAVAN_ID_KEY = 'kamperhub_active_caravan_id';
export const WATER_TANK_LEVELS_STORAGE_KEY_PREFIX = 'kamperhub_water_tank_levels_';

