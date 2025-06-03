export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ChecklistCategory = 'preDeparture' | 'campsiteSetup' | 'packDown';

export const initialChecklists: Record<ChecklistCategory, ChecklistItem[]> = {
  preDeparture: [
    { id: 'pd1', text: 'Check tyre pressures (vehicle & caravan)', completed: false },
    { id: 'pd2', text: 'Secure all items inside caravan', completed: false },
    { id: 'pd3', text: 'Connect safety chains and breakaway cable', completed: false },
    { id: 'pd4', text: 'Check lights and indicators', completed: false },
    { id: 'pd5', text: 'Water tanks filled/empty as desired', completed: false },
  ],
  campsiteSetup: [
    { id: 'cs1', text: 'Level caravan', completed: false },
    { id: 'cs2', text: 'Connect power and water', completed: false },
    { id: 'cs3', text: 'Deploy awning', completed: false },
    { id: 'cs4', text: 'Set up outdoor furniture', completed: false },
  ],
  packDown: [
    { id: 'pk1', text: 'Disconnect power and water', completed: false },
    { id: 'pk2', text: 'Retract awning and secure', completed: false },
    { id: 'pk3', text: 'Secure all items for travel', completed: false },
    { id: 'pk4', text: 'Empty toilet cassette', completed: false },
    { id: 'pk5', text: 'Final walk-around check', completed: false },
  ],
};
