
export interface Journey {
  id: string;
  name: string;
  description: string | null;
  tripIds: string[];
  masterPolyline: string | null; // For the "Set and Forget" map view
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
