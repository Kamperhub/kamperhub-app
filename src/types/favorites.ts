// src/types/favorites.ts

export interface FavoriteSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  notes?: string | null;
  addedDate: string; // ISO string
  externalId?: string | null; // e.g., A Google Place ID or booking site ID
  tags?: string[]; // e.g., ["Free Camp", "Good 4G", "Dog Friendly"]
}
