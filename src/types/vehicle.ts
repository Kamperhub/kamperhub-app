
export interface VehicleStorageLocation {
  id: string;
  name: string;
  longitudinalPosition: 'front-of-front-axle' | 'between-axles' | 'rear-of-rear-axle' | 'roof-center';
  lateralPosition: 'left' | 'center' | 'right';
  distanceFromRearAxleMm?: number | null; // Distance from rear axle: +ve towards front, -ve towards rear
  distanceFromCenterlineMm?: number | null; // Distance from centerline: +ve right, -ve left
  heightFromGroundMm?: number | null; // Height of CoG from ground
  maxWeightCapacityKg?: number | null; // Max weight this location can hold
}

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  gvm: number; // Gross Vehicle Mass
  gcm: number; // Gross Combined Mass
  maxTowCapacity: number;
  maxTowballMass: number;
  fuelEfficiency: number; // L/100km
  kerbWeight?: number | null; // Weight of the vehicle with a full tank of fuel, without occupants or cargo
  frontAxleLimit?: number | null; // Max permissible load on the front axle
  rearAxleLimit?: number | null; // Max permissible load on the rear axle
  wheelbase?: number | null; // New: Vehicle wheelbase in mm
  storageLocations?: VehicleStorageLocation[];
}

export interface StoredVehicle extends VehicleFormData {
  id: string;
}

export const VEHICLES_STORAGE_KEY = 'kamperhub_vehicles_list';
export const ACTIVE_VEHICLE_ID_KEY = 'kamperhub_active_vehicle_id';
