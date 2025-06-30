
export interface PackingListItem {
  id: string; // Unique ID for the item in the UI
  name: string;
  quantity: number;
  packed: boolean;
  notes?: string;
}

export interface PackingListCategory {
  id: string; // Unique ID for the category in the UI
  name: string;
  items: PackingListItem[];
}
