
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notes?: string;
}

export interface TravelDocument {
  id: string;
  type: string; // e.g., "Car Insurance", "Travel Insurance", "Caravan Registration"
  policyNumber: string;
  provider: string;
  expiryDate?: string; // Stored as YYYY-MM-DD string or ISO string
  contactPhone?: string;
  notes?: string;
}

export const EMERGENCY_CONTACTS_STORAGE_KEY = 'kamperhub_emergency_contacts';
export const TRAVEL_DOCUMENTS_STORAGE_KEY = 'kamperhub_travel_documents';
