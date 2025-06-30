
'use server';
/**
 * @fileOverview AI agent for generating packing lists for caravanning trips.
 *
 * - generatePackingList - A function that generates a categorized packing list.
 * - PackingListGeneratorInput - The input type for the list generation.
 * - PackingListGeneratorOutput - The output type for the list generation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const PackingListGeneratorInputSchema = z.object({
  destination: z.string().describe('The primary destination of the trip (e.g., "Cairns, QLD", "Tasmanian Coast").'),
  durationInDays: z.number().int().positive().describe('The total number of days for the trip.'),
  numberOfAdults: z.number().int().min(0).describe('The number of adults on the trip.'),
  numberOfChildren: z.number().int().min(0).describe('The number of children on the trip.'),
  activities: z.string().optional().describe('A brief description of planned activities, like "hiking, swimming, fishing".'),
});
export type PackingListGeneratorInput = z.infer<typeof PackingListGeneratorInputSchema>;

export const PackingListGeneratorOutputSchema = z.object({
  packingList: z.array(z.object({
    category: z.string().describe("A logical packing category (e.g., 'Clothing', 'Toiletries', 'Kitchen Supplies', 'Entertainment', 'Safety & First Aid')."),
    items: z.array(z.object({
      itemName: z.string().describe("The name of the individual item to pack."),
      quantity: z.number().int().positive().describe("A suggested quantity for the item, considering the trip duration and number of people."),
      notes: z.string().optional().describe("A brief, helpful note, e.g., 'Pack for warm days and cool nights' or 'For 2 adults, 2 children'."),
    })).describe("A list of items within this category."),
  })).describe("An array of packing categories, each with a list of items."),
});
export type PackingListGeneratorOutput = z.infer<typeof PackingListGeneratorOutputSchema>;

export async function generatePackingList(input: PackingListGeneratorInput): Promise<PackingListGeneratorOutput> {
  return packingListGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'packingListGeneratorPrompt',
  input: {schema: PackingListGeneratorInputSchema},
  output: {schema: PackingListGeneratorOutputSchema},
  prompt: `You are an expert trip planner and packing assistant for Australian caravan and camping adventures. Your task is to generate a comprehensive and practical packing list based on the user's trip details.

**Trip Details:**
*   **Destination:** {{{destination}}}
*   **Duration:** {{{durationInDays}}} days
*   **Passengers:** {{{numberOfAdults}}} adults, {{{numberOfChildren}}} children
*   **Planned Activities:** {{{activities}}}

**Instructions:**
1.  **Generate a Categorized List:** Create a structured packing list divided into logical categories (e.g., Clothing, Toiletries, Kitchen Supplies, Safety, Documents, Kids' Gear, etc.).
2.  **Suggest Quantities:** For each item, suggest a reasonable quantity based on the trip duration and number of passengers. For clothing, estimate per person.
3.  **Be Context-Aware:** Tailor suggestions to the destination and activities. If the destination is tropical, suggest light clothing and insect repellent. If activities include hiking, suggest hiking boots.
4.  **Add Helpful Notes:** Include brief, useful notes for items where appropriate (e.g., for clothing, "Pack layers for variable weather").
5.  **Be Comprehensive:** Include general caravanning essentials like chocks, hoses, and power leads, but place them in a suitable category like 'Caravan Essentials'.
6.  **Output Format:** You MUST generate the output in the structured JSON format defined by the output schema. Ensure all fields are correctly populated.

Generate the packing list now.
`,
});

const packingListGeneratorFlow = ai.defineFlow(
  {
    name: 'packingListGeneratorFlow',
    inputSchema: PackingListGeneratorInputSchema,
    outputSchema: PackingListGeneratorOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI_MODEL_OUTPUT_ERROR: Failed to generate packing list content in the expected format.');
      }
      return output;
    } catch (error: any) {
      console.error("Error in packingListGeneratorFlow:", error);
      throw new Error(`AI_PROMPT_ERROR: An unexpected error occurred while calling the AI prompt. Original: ${error.message}`);
    }
  }
);
