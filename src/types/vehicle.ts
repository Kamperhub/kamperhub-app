
export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  gvm: number; // Gross Vehicle Mass
  gcm: number; // Gross Combined Mass
  maxTowCapacity: number;
  maxTowballMass: number;
  fuelEfficiency: number; // L/100km
}

export interface StoredVehicle extends VehicleFormData {
  id: string;
}
