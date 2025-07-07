
import type { DateRange } from 'react-day-picker';
import type { ChecklistStage } from '@/types/checklist';
import type { BudgetCategory, Expense } from '@/types/expense';

export interface TripPlannerFormValues {
  startLocation: string;
  endLocation: string;
  waypoints?: string[]; // For user input of waypoint addresses
  fuelEfficiency: number; // Litres/100km
  fuelPrice: number; // Price per litre
  dateRange?: DateRange | null;
  maxHeight?: number;
}

export interface RouteDetails {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  startLocation?: google.maps.LatLngLiteral;
  endLocation?: google.maps.LatLngLiteral;
  polyline?: string;
  warnings?: string[];
}

export interface FuelEstimate {
  fuelNeeded: string; // e.g., "10.0 L"
  estimatedCost: string; // e.g., "$20.00"
}

export interface Waypoint {
  address: string; // The address string of the waypoint as entered by user or resolved
  location?: google.maps.LatLngLiteral; // Optional: geocoded LatLng of the waypoint
  // Potentially other details like a user-defined name for the waypoint could be added
}

export interface Occupant {
  id: string;
  name: string;
  type: 'Adult' | 'Child' | 'Infant' | 'Pet';
  age?: number | null;
  weight: number; // in kg
  notes?: string | null;
}

export interface LoggedTrip {
  id: string;
  name: string;
  timestamp: string; // ISO string for date
  startLocationDisplay: string; // The string input by the user for start
  endLocationDisplay: string; // The string input by the user for end
  waypoints?: Waypoint[]; // Array of waypoints for the logged trip
  fuelEfficiency: number;
  fuelPrice: number;
  routeDetails: RouteDetails; // For a multi-stop trip, this might represent overall details
  fuelEstimate: FuelEstimate | null;
  plannedStartDate?: string | null; // Stored as ISO string
  plannedEndDate?: string | null; // Stored as ISO string
  notes?: string | null; // Optional notes field
  isCompleted?: boolean; // New field for completion status
  isVehicleOnly?: boolean; // New field to mark trips without a caravan
  checklists?: ChecklistStage[] | { preDeparture: any[]; campsiteSetup: any[]; packDown: any[]; }; // A trip can have its own checklist set, supports old and new format for migration
  
  // New fields for expense tracking
  budget?: BudgetCategory[];
  expenses?: Expense[];
  
  // New field for occupants
  occupants?: Occupant[];

  activeCaravanIdAtTimeOfCreation?: string | null;
  activeCaravanNameAtTimeOfCreation?: string | null;
}

// Key for localStorage
export const RECALLED_TRIP_DATA_KEY = 'kamperhub_recalled_trip_data';
