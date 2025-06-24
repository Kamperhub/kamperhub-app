
import { z } from 'zod';

// Schema for a single budget category within a trip
export const budgetCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  budgetedAmount: z.coerce.number().min(0, "Budgeted amount must be non-negative"),
});

export type BudgetCategory = z.infer<typeof budgetCategorySchema>;

// Schema for a single expense entry linked to a trip and a category
export const expenseSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  categoryId: z.string(),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.string().datetime({ message: "Expense date must be a valid ISO date string" }),
  timestamp: z.string().datetime(),
});

export type Expense = z.infer<typeof expenseSchema>;
