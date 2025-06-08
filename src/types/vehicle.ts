
export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  gvm: number; // Gross Vehicle Mass
  gcm: number; // Gross Combined Mass
  maxTowCapacity: number;
  maxTowballMass: number;
  fuelEfficiency: number; // L/100km
  kerbWeight?: number; // Weight of the vehicle with a full tank of fuel, without occupants or cargo
  frontAxleLimit?: number; // Max permissible load on the front axle
  rearAxleLimit?: number; // Max permissible load on the rear axle
  wheelbase?: number | null; // New: Vehicle wheelbase in mm
}

export interface StoredVehicle extends VehicleFormData {
  id: string;
}

export const VEHICLES_STORAGE_KEY = 'kamperhub_vehicles_list';
export const ACTIVE_VEHICLE_ID_KEY = 'kamperhub_active_vehicle_id';
