
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ChecklistCategory = 'preDeparture' | 'campsiteSetup' | 'packDown';

// This remains the global default template for new trips.
export const initialChecklists: Readonly<Record<ChecklistCategory, readonly ChecklistItem[]>> = {
  preDeparture: [
    { id: 'pd1_tpl', text: 'Check tyre pressures (vehicle & caravan)', completed: false },
    { id: 'pd2_tpl', text: 'Secure all items inside caravan', completed: false },
    { id: 'pd3_tpl', text: 'Connect safety chains and breakaway cable', completed: false },
    { id: 'pd4_tpl', text: 'Check lights and indicators', completed: false },
    { id: 'pd5_tpl', text: 'Water tanks filled/empty as desired', completed: false },
  ],
  campsiteSetup: [
    { id: 'cs1_tpl', text: 'Level caravan', completed: false },
    { id: 'cs2_tpl', text: 'Connect power and water', completed: false },
    { id: 'cs3_tpl', text: 'Deploy awning', completed: false },
    { id: 'cs4_tpl', text: 'Set up outdoor furniture', completed: false },
  ],
  packDown: [
    { id: 'pk1_tpl', text: 'Disconnect power and water', completed: false },
    { id: 'pk2_tpl', text: 'Retract awning and secure', completed: false },
    { id: 'pk3_tpl', text: 'Secure all items for travel', completed: false },
    { id: 'pk4_tpl', text: 'Empty toilet cassette', completed: false },
    { id: 'pk5_tpl', text: 'Final walk-around check', completed: false },
  ],
};

// New type for storing checklists associated with a specific trip.
export interface TripChecklistSet {
  tripName: string;
  preDeparture: ChecklistItem[];
  campsiteSetup: ChecklistItem[];
  packDown: ChecklistItem[];
}

// The main storage key for all trip checklists.
// It will store a record where the key is the tripId.
export const TRIP_CHECKLISTS_STORAGE_KEY = 'kamperhub_trip_checklists_v2'; // Changed key to avoid conflicts with old structure

// Type for the entire collection of trip checklists stored in localStorage.
export type AllTripChecklists = Record<string, TripChecklistSet>;

// Old key - can be deprecated or used for a migration strategy if needed.
// export const OLD_CARAVAN_CHECKLISTS_STORAGE_KEY = 'kamperhub_caravan_checklists';
// export type CaravanChecklists = Record<string, Partial<Record<ChecklistCategory, ChecklistItem[]>>>;
