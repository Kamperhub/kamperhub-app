
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ChecklistCategory = 'preDeparture' | 'campsiteSetup' | 'packDown';

// This remains the global default template for new trips if no caravan default is found.
export const initialChecklists: Readonly<Record<ChecklistCategory, readonly ChecklistItem[]>> = {
  preDeparture: [
    { id: 'global_pd1_tpl', text: 'Check tyre pressures (vehicle & caravan)', completed: false },
    { id: 'global_pd2_tpl', text: 'Secure all items inside caravan', completed: false },
    { id: 'global_pd3_tpl', text: 'Connect safety chains and breakaway cable', completed: false },
    { id: 'global_pd4_tpl', text: 'Check lights and indicators', completed: false },
    { id: 'global_pd5_tpl', text: 'Water tanks filled/empty as desired', completed: false },
  ],
  campsiteSetup: [
    { id: 'global_cs1_tpl', text: 'Level caravan', completed: false },
    { id: 'global_cs2_tpl', text: 'Connect power and water', completed: false },
    { id: 'global_cs3_tpl', text: 'Deploy awning', completed: false },
    { id: 'global_cs4_tpl', text: 'Set up outdoor furniture', completed: false },
  ],
  packDown: [
    { id: 'global_pk1_tpl', text: 'Disconnect power and water', completed: false },
    { id: 'global_pk2_tpl', text: 'Retract awning and secure', completed: false },
    { id: 'global_pk3_tpl', text: 'Secure all items for travel', completed: false },
    { id: 'global_pk4_tpl', text: 'Empty toilet cassette', completed: false },
    { id: 'global_pk5_tpl', text: 'Final walk-around check', completed: false },
  ],
};

// For storing checklists associated with a specific trip. This is now part of the LoggedTrip object.
export interface TripChecklistSet {
  preDeparture: ChecklistItem[];
  campsiteSetup: ChecklistItem[];
  packDown: ChecklistItem[];
}
export const TRIP_CHECKLISTS_STORAGE_KEY = 'kamperhub_trip_checklists_v3';
export type AllTripChecklists = Record<string, TripChecklistSet>; // Key is tripId

// For storing default checklists associated with a specific caravan.
export interface CaravanDefaultChecklistSet {
  // No caravanName here, as it's keyed by caravanId
  preDeparture: ChecklistItem[];
  campsiteSetup: ChecklistItem[];
  packDown: ChecklistItem[];
}
export const CARAVAN_DEFAULT_CHECKLISTS_STORAGE_KEY = 'kamperhub_caravan_default_checklists_v1';
export type AllCaravanDefaultChecklists = Record<string, CaravanDefaultChecklistSet>; // Key is caravanId
