
import type { DateRange } from 'react-day-picker';

export interface TripPlannerFormValues {
  startLocation: string;
  endLocation: string;
  fuelEfficiency: number; // L/100km
  fuelPrice: number; // Price per liter
  dateRange?: DateRange | null;
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

export interface LoggedTrip {
  id: string;
  name: string;
  timestamp: string; // ISO string for date
  startLocationDisplay: string; // The string input by the user for start
  endLocationDisplay: string; // The string input by the user for end
  fuelEfficiency: number;
  fuelPrice: number;
  routeDetails: RouteDetails;
  fuelEstimate: FuelEstimate | null;
  plannedStartDate?: string | null; // Stored as ISO string
  plannedEndDate?: string | null; // Stored as ISO string
  notes?: string; // Optional notes field
  isCompleted?: boolean; // New field for completion status
}

// Key for localStorage
export const TRIP_LOG_STORAGE_KEY = 'kamperhub_trip_log';
export const RECALLED_TRIP_DATA_KEY = 'kamperhub_recalled_trip_data';

