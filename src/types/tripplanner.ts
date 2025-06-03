
export interface TripPlannerFormValues {
  startLocation: string;
  endLocation: string;
  fuelEfficiency: number; // L/100km
  fuelPrice: number; // Price per liter
}

export interface RouteDetails {
  distance: string; // e.g., "100 km"
  duration: string; // e.g., "1 hour 30 mins"
  distanceValue: number; // distance in meters
  startAddress?: string;
  endAddress?: string;
  startLocation?: google.maps.LatLngLiteral;
  endLocation?: google.maps.LatLngLiteral;
}

export interface FuelEstimate {
  fuelNeeded: string; // e.g., "10.0 L"
  estimatedCost: string; // e.g., "$20.00"
}
