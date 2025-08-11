'use server';
/**
 * @fileOverview An AI agent for generating a starter inventory list for a new caravan owner.
 *
 * - generateStarterInventory - Generates a categorized list of common items.
 * - StarterInventoryInput - Input type for the starter inventory generator.
 * - StarterInventoryOutput - Output type for the starter inventory generator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StorageLocationInputSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const StarterInventoryInputSchema = z.object({
  caravanType: z.string().describe("The type of caravan or rig, e.g., 'Caravan', 'Campervan', 'Tent'."),
  payloadCapacity: z.number().positive().describe("The total payload capacity of the caravan in kilograms."),
  storageLocations: z.array(StorageLocationInputSchema).describe("A list of available storage locations in the caravan, each with an ID and a name."),
});
export type StarterInventoryInput = z.infer<typeof StarterInventoryInputSchema>;

const StarterInventoryOutputSchema = z.object({
  categories: z.array(
    z.object({
      categoryName: z.string().describe("The name of the inventory category (e.g., 'Kitchen Essentials', 'Safety Gear')."),
      items: z.array(
        z.object({
          name: z.string().describe("The name of the inventory item."),
          weight: z.number().describe("An estimated weight for the item in kilograms."),
          quantity: z.number().int().min(1).describe("A suggested starting quantity for the item."),
          suggestedLocationId: z.string().optional().nullable().describe("The ID of the most logical storage location for this item from the provided list."),
        })
      ).describe("A list of suggested items with estimated weights and quantities."),
    })
  ).describe("A categorized list of starter inventory items."),
});
export type StarterInventoryOutput = z.infer<typeof StarterInventoryOutputSchema>;

export async function generateStarterInventory(input: StarterInventoryInput): Promise<StarterInventoryOutput> {
  return starterInventoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'starterInventorySuggesterPrompt',
  input: { schema: StarterInventoryInputSchema },
  output: { schema: StarterInventoryOutputSchema },
  prompt: `You are an expert caravanning setup assistant. Your task is to generate a sensible, essential starter inventory list for a novice owner, and logically assign each item to an available storage location.

**Rig Details:**
*   **Type:** {{{caravanType}}}
*   **Payload Capacity:** {{{payloadCapacity}}} kg
*   **Available Storage Locations:**
    {{#each storageLocations}}
    - ID: {{this.id}}, Name: "{{this.name}}"
    {{/each}}

**Instructions:**
1.  **Generate Essential Items:** Based on the rig type, create a list of common, essential items a new owner would need. Focus on core categories like Kitchen, Bedding, Safety, Outdoor Living, and Basic Tools.
2.  **Estimate Weights:** For each item, provide a realistic estimated weight in kilograms. Be conservative with weights.
3.  **Suggest Quantities:** Suggest a reasonable starting quantity for each item (e.g., 2x Camping Chairs, 4x Plates).
4.  **Assign Locations:** For each generated item, analyze the list of available storage locations and assign the most logical one by setting the 'suggestedLocationId'. For example, assign 'Pots & Pans' to a location named 'Kitchen Cupboard'. If no suitable location exists, you can leave it null.
5.  **Stay Within Payload:** The total weight of all suggested items (item weight * quantity) should NOT exceed 50% of the provided payload capacity. This leaves ample room for the user's personal belongings.
6.  **Categorize Sensibly:** Group the items into logical categories.
7.  **Be Novice-Focused:** Do not include highly specialized or luxury items. This is a starter kit.

Generate the starter inventory list now.
`,
});

const starterInventoryFlow = ai.defineFlow(
  {
    name: 'starterInventoryFlow',
    inputSchema: StarterInventoryInputSchema,
    outputSchema: StarterInventoryOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
      }
      return output;
    } catch (error: any) {
      console.error("Error in starterInventoryFlow:", error);
      throw new Error(`AI Service Error: ${error.message || 'An unknown error occurred.'}`);
    }
  }
);
