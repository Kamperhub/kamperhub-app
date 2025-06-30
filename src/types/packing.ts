
import { z } from 'zod';

export const packingListItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  packed: z.boolean(),
  notes: z.string().optional(),
});
export type PackingListItem = z.infer<typeof packingListItemSchema>;

export const packingListCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  items: z.array(packingListItemSchema),
});
export type PackingListCategory = z.infer<typeof packingListCategorySchema>;
