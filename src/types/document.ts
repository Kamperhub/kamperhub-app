
// src/types/document.ts

export const documentTags = [
  "Insurance",
  "Registration",
  "Manual",
  "Receipt",
  "Booking Confirmation",
  "Map",
  "Permit",
  "Other",
] as const;

export type DocumentTag = typeof documentTags[number];

export interface StoredDocument {
  id: string;
  name: string;
  description: string | null;
  fileUrl: string;
  tags: DocumentTag[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
