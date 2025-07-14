
import type { DateRange } from 'react-day-picker';
import type { ChecklistStage } from '@/types/checklist';
import type { BudgetCategory, Expense } from '@/types/expense';

export interface TripPlannerFormValues {
  startLocation: string;
  endLocation: string;
  fuelEfficiency: number; // Litres/100km
  fuelPrice: number; // Price per litre
  dateRange?: DateRange | null;
  maxHeight?: number;
}

export interface FuelStation {
  name: string;
  location: google.maps.LatLngLiteral;
}

export interface RouteDetails {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  startLocation?: google.maps.LatLngLiteral;
  endLocation?: google.maps.LatLngLiteral;
  polyline?: string;
  warnings?: string[];
  tollInfo?: { text: string; value: number } | null;
  fuelStations?: FuelStation[];
}

export interface FuelEstimate {
  fuelNeeded: string; // e.g., "10.0 L"
  estimatedCost: string; // e.g., "$20.00"
}


export interface Occupant {
  id: string;
  name: string;
  type: 'Adult' | 'Child' | 'Infant' | 'Pet';
  age?: number | null;
  weight: number; // in kg
  notes?: string | null;
}

// Represents a waypoint in a multi-stop trip
export interface Waypoint {
    address: string;
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
  
  // New field for Journey association
  journeyId?: string | null;
}

// Key for localStorage
export const RECALLED_TRIP_DATA_KEY = 'kamperhub_recalled_trip_data';

    