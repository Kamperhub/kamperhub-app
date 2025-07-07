
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ChecklistCategory = 'preDeparture' | 'campsiteSetup' | 'packDown';

// This remains the global default template for new trips if no caravan default is found.
export const initialChecklists: Readonly<Record<ChecklistCategory, readonly ChecklistItem[]>> = {
  preDeparture: [
    // --- Inside Checks ---
    { id: 'global_pd1_tpl', text: 'Secure all loose items in cupboards and on benches', completed: false },
    { id: 'global_pd2_tpl', text: 'Lock refrigerator door', completed: false },
    { id: 'global_pd3_tpl', text: 'Lower and secure TV antenna', completed: false },
    { id: 'global_pd4_tpl', text: 'Turn off all internal lights and 12V accessories', completed: false },
    { id: 'global_pd5_tpl', text: 'Close and lock all internal doors and drawers', completed: false },
    // --- System Checks ---
    { id: 'global_pd6_tpl', text: 'Turn off gas appliances and close gas bottles', completed: false },
    { id: 'global_pd7_tpl', text: 'Switch fridge to appropriate travel power source (12V/Gas)', completed: false },
    { id: 'global_pd8_tpl', text: 'Turn off water pump', completed: false },
    { id: 'global_pd9_tpl', text: 'Fill fresh water tanks / Empty grey & black tanks as needed', completed: false },
    // --- Exterior Checks ---
    { id: 'global_pd10_tpl', text: 'Retract and lock awning securely', completed: false },
    { id: 'global_pd11_tpl', text: 'Close and lock all windows and roof hatches', completed: false },
    { id: 'global_pd12_tpl', text: 'Retract and secure caravan step', completed: false },
    { id: 'global_pd13_tpl', text: 'Lock main caravan door', completed: false },
    { id: 'global_pd14_tpl', text: 'Retract and secure stabiliser legs', completed: false },
    { id: 'global_pd15_tpl', text: 'Disconnect and stow power lead, water hoses, and drain hoses', completed: false },
    // --- Hitching and Final Checks ---
    { id: 'global_pd16_tpl', text: 'Hitch caravan to tow vehicle securely', completed: false },
    { id: 'global_pd17_tpl', text: 'Connect safety chains and breakaway cable', completed: false },
    { id: 'global_pd18_tpl', text: 'Connect 7/12-pin plug and check all lights (indicators, brake, tail)', completed: false },
    { id: 'global_pd19_tpl', text: 'Retract jockey wheel fully', completed: false },
    { id: 'global_pd20_tpl', text: 'Check tyre pressures (vehicle & caravan)', completed: false },
    { id: 'global_pd21_tpl', text: 'Attach and adjust towing mirrors', completed: false },
    { id: 'global_pd22_tpl', text: 'Test brake controller manually', completed: false },
    { id: 'global_pd23_tpl', text: 'Perform final walk-around of rig and check for obstacles', completed: false },
  ],
  campsiteSetup: [
    // --- Positioning & Securing ---
    { id: 'global_cs1_tpl', text: 'Position caravan on site (check for hazards/obstacles)', completed: false },
    { id: 'global_cs2_tpl', text: 'Level caravan side-to-side (using ramps)', completed: false },
    { id: 'global_cs3_tpl', text: 'Chock wheels securely', completed: false },
    // --- Unhitching & Levelling ---
    { id: 'global_cs4_tpl', text: 'Unhitch from vehicle (disconnect chains, power, etc.)', completed: false },
    { id: 'global_cs5_tpl', text: 'Move tow vehicle away from caravan', completed: false },
    { id: 'global_cs6_tpl', text: 'Level caravan front-to-back (using jockey wheel)', completed: false },
    { id: 'global_cs7_tpl', text: 'Deploy stabiliser legs (do not use for lifting)', completed: false },
    // --- Connecting Utilities ---
    { id: 'global_cs8_tpl', text: 'Connect power lead (van side first, then pole)', completed: false },
    { id: 'global_cs9_tpl', text: 'Connect water hose (with filter if needed)', completed: false },
    { id: 'global_cs10_tpl', text: 'Connect grey water hose/container', completed: false },
    // --- Final Setup ---
    { id: 'global_cs11_tpl', text: 'Turn on gas bottles', completed: false },
    { id: 'global_cs12_tpl', text: 'Switch fridge to appropriate power source (240V/Gas)', completed: false },
    { id: 'global_cs13_tpl', text: 'Turn on hot water system (if needed)', completed: false },
    { id: 'global_cs14_tpl', text: 'Raise TV antenna', completed: false },
    { id: 'global_cs15_tpl', text: 'Extend caravan step', completed: false },
    { id: 'global_cs16_tpl', text: 'Deploy awning', completed: false },
    { id: 'global_cs17_tpl', text: 'Set up outdoor area (mats, chairs, table)', completed: false },
  ],
  packDown: [
    // --- Internal & Waste ---
    { id: 'global_pk1_tpl', text: 'Clean and empty toilet cassette', completed: false },
    { id: 'global_pk2_tpl', text: 'Switch fridge to 12V/Off for travel', completed: false },
    { id: 'global_pk3_tpl', text: 'Turn off all appliances and water pump', completed: false },
    { id: 'global_pk4_tpl', text: 'Lower and secure TV antenna', completed: false },
    { id: 'global_pk5_tpl', text: 'Secure all items inside caravan', completed: false },
    // --- External Area ---
    { id: 'global_pk6_tpl', text: 'Clean and stow BBQ', completed: false },
    { id: 'global_pk7_tpl', text: 'Stow all outdoor gear (furniture, mats)', completed: false },
    { id: 'global_pk8_tpl', text: 'Retract and secure awning', completed: false },
    // --- Disconnect Utilities ---
    { id: 'global_pk9_tpl', text: 'Empty grey water tank/container', completed: false },
    { id: 'global_pk10_tpl', text: 'Disconnect grey water hose', completed: false },
    { id: 'global_pk11_tpl', text: 'Disconnect fresh water hose', completed: false },
    { id: 'global_pk12_tpl', text: 'Disconnect power lead (van side first)', completed: false },
    // --- Secure Van for Travel ---
    { id: 'global_pk13_tpl', text: 'Turn off gas bottles', completed: false },
    { id: 'global_pk14_tpl', text: 'Close and lock all windows, hatches, and door', completed: false },
    { id: 'global_pk15_tpl', text: 'Retract caravan step', completed: false },
    { id: 'global_pk16_tpl', text: 'Retract stabiliser legs completely', completed: false },
    // --- Hitching & Departure ---
    { id: 'global_pk17_tpl', text: 'Hitch up to vehicle and connect electrics/chains', completed: false },
    { id: 'global_pk18_tpl', text: 'Perform light check', completed: false },
    { id: 'global_pk19_tpl', text: 'Remove wheel chocks', completed: false },
    { id: 'global_pk20_tpl', text: 'Final walk-around check of site and rig', completed: false },
  ],
};

// New template for vehicle-only trips
export const vehicleOnlyChecklists: Readonly<Record<ChecklistCategory, readonly ChecklistItem[]>> = {
  preDeparture: [
    { id: 'vehicle_pd1_tpl', text: 'Check vehicle tyre pressures', completed: false },
    { id: 'vehicle_pd2_tpl', text: 'Check vehicle fluids (oil, coolant, washer fluid)', completed: false },
    { id: 'vehicle_pd3_tpl', text: 'Check vehicle has adequate fuel for the journey', completed: false },
    { id: 'vehicle_pd4_tpl', text: 'Check lights and indicators', completed: false },
    { id: 'vehicle_pd5_tpl', text: 'Secure all items/luggage in vehicle', completed: false },
    { id: 'vehicle_pd6_tpl', text: 'Pack recovery gear (if going off-road)', completed: false },
    { id: 'vehicle_pd7_tpl', text: 'Confirm navigation/GPS is ready', completed: false },
    { id: 'vehicle_pd8_tpl', text: 'Pack snacks and water for the journey', completed: false },
  ],
  campsiteSetup: [
    { id: 'vehicle_cs1_tpl', text: 'Select and clear tent/swag site', completed: false },
    { id: 'vehicle_cs2_tpl', text: 'Set up tent/swag and sleeping gear', completed: false },
    { id: 'vehicle_cs3_tpl', text: 'Arrange cooking area and camp kitchen', completed: false },
    { id: 'vehicle_cs4_tpl', text: 'Set up camp chairs and table', completed: false },
    { id: 'vehicle_cs5_tpl', text: 'Organize lighting for the evening', completed: false },
    { id: 'vehicle_cs6_tpl', text: 'Secure food storage from animals', completed: false },
    { id: 'vehicle_cs7_tpl', text: 'Check campfire regulations and prepare fire pit safely (if applicable)', completed: false },
    { id: 'vehicle_cs8_tpl', text: 'Familiarize with camp amenities (toilets, water)', completed: false },
  ],
  packDown: [
    { id: 'vehicle_pk1_tpl', text: 'Pack sleeping bags and bedding', completed: false },
    { id: 'vehicle_pk2_tpl', text: 'Disassemble and pack tent/swag', completed: false },
    { id: 'vehicle_pk3_tpl', text: 'Clean and pack cooking gear', completed: false },
    { id: 'vehicle_pk4_tpl', text: 'Extinguish campfire completely with water', completed: false },
    { id: 'vehicle_pk5_tpl', text: 'Pack all rubbish (leave no trace)', completed: false },
    { id: 'vehicle_pk6_tpl', text: 'Secure all items in vehicle', completed: false },
    { id: 'vehicle_pk7_tpl', text: 'Thoroughly clean campsite area', completed: false },
    { id: 'vehicle_pk8_tpl', text: 'Final walk-around of site to check for forgotten items', completed: false },
  ],
};


// For storing checklists associated with a specific trip. This is now part of the LoggedTrip object.
export interface TripChecklistSet {
  preDeparture: ChecklistItem[];
  campsiteSetup: ChecklistItem[];
  packDown: ChecklistItem[];
}
export type AllTripChecklists = Record<string, TripChecklistSet>; // Key is tripId

// For storing default checklists associated with a specific caravan.
export interface CaravanDefaultChecklistSet {
  // No caravanName here, as it's keyed by caravanId
  preDeparture: ChecklistItem[];
  campsiteSetup: ChecklistItem[];
  packDown: ChecklistItem[];
}
export type AllCaravanDefaultChecklists = Record<string, CaravanDefaultChecklistSet>; // Key is caravanId
