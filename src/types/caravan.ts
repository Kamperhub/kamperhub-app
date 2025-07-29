
import type { LucideIcon } from 'lucide-react';

export const caravanTypeDetails = [
  { name: "Caravan", icon: 'Caravan', description: "A standard towed trailer with rigid walls." },
  { name: "Pop-Top Caravan & Folding Camper", icon: 'TentTree', description: "A towable unit that folds or has a pop-top roof." },
  { name: "Motorhome", icon: 'Bus', description: "A self-propelled vehicle with living quarters." },
  { name: "Campervan", icon: 'Van', description: "A van converted for sleeping and camping." },
  { name: "Slide-on Camper", icon: 'Truck', description: "A camper unit that sits on a utility vehicle tray." },
  { name: "Fifth Wheeler", icon: 'Trailer', description: "A large trailer that attaches via a gooseneck." },
  { name: "Tent", icon: 'Tent', description: "Ground-based tent camping equipment." },
  { name: "Utility Trailer", icon: 'Square', description: "A simple trailer for carrying goods or equipment." },
  { name: "Other", icon: 'Square', description: "Any other type of rig or setup." },
] as const;


export const caravanTypes = caravanTypeDetails.map(detail => detail.name);
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
