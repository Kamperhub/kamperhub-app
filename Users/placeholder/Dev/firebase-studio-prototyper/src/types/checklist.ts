
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistStage {
  title: string;
  items: ChecklistItem[];
}

export interface CaravanDefaultChecklistSet {
  vehiclePreTravel: ChecklistStage;
  hitchingUp: ChecklistStage;
  caravanInterior: ChecklistStage;
  caravanExterior: ChecklistStage;
  finalDeparture: ChecklistStage;
  campsiteSetup: ChecklistStage;
}


// --- VEHICLE-SPECIFIC STAGES ---
export const defaultVehicleChecklistStages: readonly ChecklistStage[] = [
  {
    title: 'Vehicle Pre-Travel Checks',
    items: [
      { id: 'veh_pd1', text: 'Check tyre pressures (including spare)', completed: false },
      { id: 'veh_pd2', text: 'Check engine oil level', completed: false },
      { id: 'veh_pd3', text: 'Check coolant level', completed: false },
      { id: 'veh_pd4', text: 'Check windscreen washer fluid', completed: false },
      { id: 'veh_pd5', text: 'Ensure vehicle has adequate fuel', completed: false },
      { id: 'veh_pd6', text: 'Pack vehicle recovery gear (if applicable)', completed: false },
      { id: 'veh_pd7', text: 'Check that mirrors are clean and adjusted', completed: false },
    ],
  },
  {
    title: 'Hitching Up',
    items: [
      { id: 'veh_h1', text: 'Reverse vehicle to align with caravan coupling', completed: false },
      { id: 'veh_h2', text: 'Lower caravan coupling onto tow ball and lock securely', completed: false },
      { id: 'veh_h3', text: 'Attach and cross safety chains', completed: false },
      { id: 'veh_h4', text: 'Connect breakaway cable to vehicle', completed: false },
      { id: 'veh_h5', text: 'Connect 7/12-pin electrical plug', completed: false },
      { id: 'veh_h6', text: 'Attach Weight Distribution Hitch (if applicable)', completed: false },
      { id: 'veh_h7', text: 'Raise and secure jockey wheel', completed: false },
      { id: 'veh_h8', text: 'Test brake controller manually', completed: false },
    ],
  },
];

// --- CARAVAN-SPECIFIC STAGES ---
export const defaultCaravanChecklistStages: readonly ChecklistStage[] = [
  {
    title: 'Caravan Interior Secure',
    items: [
      { id: 'cv_int1', text: 'Secure all loose items in cupboards and on benches', completed: false },
      { id: 'cv_int2', text: 'Lock refrigerator door', completed: false },
      { id: 'cv_int3', text: 'Lower and secure TV antenna/satellite dish', completed: false },
      { id: 'cv_int4', text: 'Turn off all internal lights and 12V accessories', completed: false },
      { id: 'cv_int5', text: 'Turn off water pump', completed: false },
      { id: 'cv_int6', text: 'Switch fridge to appropriate travel power source (12V/Gas)', completed: false },
      { id: 'cv_int7', text: 'Close and lock all internal doors, drawers, and shower screen', completed: false },
    ],
  },
  {
    title: 'Caravan Exterior & Utilities',
    items: [
      { id: 'cv_ext1', text: 'Retract and lock awning securely', completed: false },
      { id: 'cv_ext2', text: 'Close and lock all windows and roof hatches', completed: false },
      { id: 'cv_ext3', text: 'Retract and secure caravan step', completed: false },
      { id: 'cv_ext4', text: 'Lock main caravan door and any external storage lockers', completed: false },
      { id: 'cv_ext5', text: 'Turn off gas bottles at the source', completed: false },
      { id: 'cv_ext6', text: 'Disconnect and stow power lead', completed: false },
      { id: 'cv_ext7', text: 'Disconnect and stow fresh and grey water hoses', completed: false },
      { id: 'cv_ext8', text: 'Retract and secure all stabiliser legs', completed: false },
    ],
  },
  {
    title: 'Final Rig Departure Checks',
    items: [
      { id: 'final1', text: 'Check all caravan and vehicle lights (indicators, brake, tail)', completed: false },
      { id: 'final2', text: 'Remove wheel chocks', completed: false },
      { id: 'final3', text: 'Final walk-around of rig and campsite', completed: false },
      { id: 'final4', text: 'Check for overhead obstacles before pulling out', completed: false },
    ],
  },
];

// --- CAMPSITE SETUP STAGES ---
export const defaultSetupChecklistStages: readonly ChecklistStage[] = [
  {
    title: 'Positioning & Unhitching',
    items: [
        { id: 'setup_pos1', text: 'Position caravan on site (check for hazards/obstacles)', completed: false },
        { id: 'setup_pos2', text: 'Level caravan side-to-side (using ramps)', completed: false },
        { id: 'setup_pos3', text: 'Chock wheels securely', completed: false },
        { id: 'setup_pos4', text: 'Unhitch from vehicle (disconnect chains, power, etc.)', completed: false },
        { id: 'setup_pos5', text: 'Move tow vehicle away from caravan', completed: false },
    ],
  },
  {
    title: 'Levelling & Stabilising',
    items: [
        { id: 'setup_level1', text: 'Level caravan front-to-back (using jockey wheel)', completed: false },
        { id: 'setup_level2', text: 'Deploy stabiliser legs (do not use for lifting)', completed: false },
    ],
  },
  {
    title: 'Connecting Utilities',
    items: [
        { id: 'setup_util1', text: 'Connect power lead (van side first, then pole)', completed: false },
        { id: 'setup_util2', text: 'Connect water hose (with filter if needed)', completed: false },
        { id: 'setup_util3', text: 'Connect grey water hose/container', completed: false },
        { id: 'setup_util4', text: 'Turn on gas bottles', completed: false },
        { id: 'setup_util5', text: 'Switch fridge to appropriate power source (240V/Gas)', completed: false },
        { id: 'setup_util6', text: 'Turn on hot water system (if needed)', completed: false },
    ]
  },
  {
    title: 'Final Campsite Setup',
    items: [
        { id: 'setup_final1', text: 'Raise TV antenna', completed: false },
        { id: 'setup_final2', text: 'Extend caravan step', completed: false },
        { id: 'setup_final3', text: 'Deploy awning', completed: false },
        { id: 'setup_final4', text: 'Set up outdoor area (mats, chairs, table)', completed: false },
    ]
  }
];

// Combined default for a full rig (Vehicle + Caravan)
export const fullRigChecklist: readonly ChecklistStage[] = [
  ...defaultVehicleChecklistStages,
  ...defaultCaravanChecklistStages,
];

// Default for vehicle-only camping
export const vehicleOnlyChecklist: readonly ChecklistStage[] = [
  defaultVehicleChecklistStages[0], // Vehicle Pre-Travel Checks
  {
    title: 'Campsite Setup (Vehicle Only)',
    items: [
      { id: 'veh_cs1', text: 'Select and clear tent/swag site', completed: false },
      { id: 'veh_cs2', text: 'Set up tent/swag and sleeping gear', completed: false },
      { id: 'veh_cs3', text: 'Arrange cooking area and camp kitchen', completed: false },
      { id: 'veh_cs4', text: 'Set up camp chairs and table', completed: false },
      { id: 'veh_cs5', text: 'Organize lighting for the evening', completed: false },
      { id: 'veh_cs6', text: 'Secure food storage from animals', completed: false },
      { id: 'veh_cs7', text: 'Check campfire regulations and prepare fire pit safely (if applicable)', completed: false },
    ],
  },
  {
    title: 'Pack-Down & Departure (Vehicle Only)',
    items: [
      { id: 'veh_pk1', text: 'Pack sleeping bags and bedding', completed: false },
      { id: 'veh_pk2', text: 'Disassemble and pack tent/swag', completed: false },
      { id: 'veh_pk3', text: 'Clean and pack cooking gear', completed: false },
      { id: 'veh_pk4', text: 'Extinguish campfire completely with water', completed: false },
      { id: 'veh_pk5', text: 'Pack all rubbish (leave no trace)', completed: false },
      { id: 'veh_pk6', text: 'Secure all items in vehicle', completed: false },
      { id: 'veh_pk7', text: 'Final walk-around of site to check for forgotten items', completed: false },
    ],
  },
];

    