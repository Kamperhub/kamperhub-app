
// src/types/service.ts
import { z } from 'zod';

// For Fuel Logging
export const fuelLogSchema = z.object({
  id: z.string(),
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  date: z.string().datetime({ message: "Date must be a valid ISO date string" }),
  odometer: z.coerce.number().positive("Odometer reading must be a positive number"),
  litres: z.coerce.number().positive("Litres must be a positive number"),
  pricePerLitre: z.coerce.number().positive("Price per litre must be a positive number"),
  totalCost: z.coerce.number().positive("Total cost must be a positive number"),
  location: z.string().optional(),
  notes: z.string().optional(),
  assignedTripId: z.string().nullable().optional(),
  timestamp: z.string().datetime(),
});

export type FuelLogEntry = z.infer<typeof fuelLogSchema>;

// For Maintenance Tracking
export const maintenanceTaskSchema = z.object({
    id: z.string(),
    assetId: z.string().min(1, "Associated asset (vehicle/caravan) ID is required"),
    assetName: z.string().min(1, "Asset name is required for display"), // e.g., "Ford Ranger" or "Jayco Starcraft"
    taskName: z.string().min(1, "Task name is required"),
    category: z.enum(['Engine', 'Tyres', 'Brakes', 'Chassis', 'Electrical', 'Plumbing', 'Appliance', 'Registration', 'General']),
    dueDate: z.string().datetime({ message: "Due date must be a valid ISO date string" }).nullable().optional(),
    dueOdometer: z.coerce.number().positive("Due odometer must be a positive number").nullable().optional(),
    notes: z.string().optional(),
    isCompleted: z.boolean().default(false),
    completedDate: z.string().datetime().nullable().optional(),
    timestamp: z.string().datetime(),
});

export type MaintenanceTask = z.infer<typeof maintenanceTaskSchema>;
