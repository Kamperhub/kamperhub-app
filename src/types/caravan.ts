
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

export interface CaravanDiagram {
  id: string;
  name: string;
  url: string;
  notes?: string;
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
  diagrams?: CaravanDiagram[];
}

export interface StoredCaravan extends CaravanFormData {
  id: string;
}
