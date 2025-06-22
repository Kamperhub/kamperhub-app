
export interface WDHFormData {
  name: string; // e.g., Eaz-Lift Recurve R3, Hayman Reese 600lb Classic
  type: string; // e.g., Round Bar, Trunnion Bar, Andersen No-Sway
  maxCapacityKg: number; // Max tow ball/tongue weight capacity in kg
  minCapacityKg?: number | null; // Optional: Min tow ball/tongue weight for optimal operation
  hasIntegratedSwayControl: boolean;
  swayControlType?: string | null; // Description of sway control if not integrated or specific type
  notes?: string | null;
}

export interface StoredWDH extends WDHFormData {
  id: string;
}
