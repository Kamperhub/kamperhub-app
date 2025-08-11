// src/types/service.ts
import { z } from 'zod';

// Schema for a single fuel log entry for client-side forms and API validation
export const fuelLogSchema = z.object({
  id: z.string(),
  vehicleId: z.string({ required_error: "Please select a vehicle." }),
  date: z.string().datetime({ message: "Date must be a valid ISO date string" }),
  odometer: z.coerce.number().min(0, "Odometer reading must be a non-negative number"),
  litres: z.coerce.number().positive("Litres must be a positive number"),
  pricePerLitre: z.coerce.number().positive("Price per litre must be a positive number"),
  totalCost: z.coerce.number().positive("Total cost must be a positive number"),
  notes: z.string().optional().nullable(),
  timestamp: z.string().datetime(),
});

export type FuelLogEntry = z.infer<typeof fuelLogSchema>;


// Schema for a single maintenance task for client-side forms and API validation
export const maintenanceTaskSchema = z.object({
  id: z.string(),
  vehicleId: z.string({ required_error: "Please select a vehicle." }),
  taskName: z.string().min(1, "Task name is required"),
  description: z.string().optional().nullable(),
  serviceProvider: z.string().optional().nullable(),
  cost: z.coerce.number().min(0, "Cost must be a non-negative number").optional().nullable(),
  dateCompleted: z.string().datetime({ message: "Date must be a valid ISO date string" }),
  odometerAtCompletion: z.coerce.number().min(0, "Odometer reading must be non-negative").optional().nullable(),
  // Documents are now handled by the central Document Locker and are no longer part of this schema.
  timestamp: z.string().datetime(),
});

export type MaintenanceTask = z.infer<typeof maintenanceTaskSchema>;
