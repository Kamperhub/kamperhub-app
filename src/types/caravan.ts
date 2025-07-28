

export const caravanTypes = [
  "Caravan",
  "Folding Camper",
  "Motorhome",
  "Campervan",
  "Slide-on Camper",
  "Fifth Wheeler",
  "Tent",
  "Utility Trailer",
] as const;

export type CaravanType = typeof caravanTypes[number];


export interface WDHFormData {
  name: string;
  type: string;
  maxCapacityKg: number;
  minCapacityKg?: number | null;
  hasIntegratedSwayControl: boolean;
  swayControlType?: string | null;
  notes?: string | null;
}

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
  capacityLitres: number;
  longitudinalPosition: 'front-of-axles' | 'over-axles' | 'rear-of-axles';
  lateralPosition: 'left' | 'center' | 'right';
  distanceFromAxleCenterMm?: number | null;
}

export interface CaravanFormData {
  type: CaravanType;
  make: string;
  model: string;
  year: number;
  tareMass: number; 
  atm: number; 
  gtm: number; 
  maxTowballDownload: number;
  numberOfAxles: number;
  axleGroupRating: number;
  numberOfGasBottles?: number | null;
  gasBottleCapacityKg?: number | null;
  tyreSize?: string | null;
  tyreLoadRating?: number | null;
  tyreSpeedRating?: string | null;
  recommendedTyrePressurePsi?: number | null;
  overallLength?: number | null;
  bodyLength?: number | null;
  overallHeight?: number | null;
  hitchToAxleCenterDistance?: number | null;
  interAxleSpacing?: number | null;
  storageLocations?: StorageLocation[];
  waterTanks?: WaterTank[];
  wdh?: WDHFormData | null;
}

export interface StoredCaravan extends CaravanFormData {
  id: string;
}
