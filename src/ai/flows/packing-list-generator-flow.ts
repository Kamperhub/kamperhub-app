
'use server';
import {z} from 'zod';
import {ai} from '@/ai/genkit';
/**
 * @fileOverview AI agent for generating packing lists for caravanning trips.
 *
 * - generatePackingList - A function that generates a categorized packing list.
 * - PackingListGeneratorInput - The input type for the list generation.
 * - PackingListGeneratorOutput - The output type for the list generation.
 */

const TravelerSchema = z.object({
  type: z.enum(["Adult", "Child", "Infant", "Pet"]),
  name: z.string(),
  age: z.number().optional(),
  notes: z.string().optional().describe("Specific needs or interests, e.g., 'Likes superheroes', 'Needs joint meds'."),
});

const PackingListGeneratorInputSchema = z.object({
  destination: z.string().describe('The primary destination of the trip (e.g., "Kyoto, Japan", "Colorado Rocky Mountains, USA").'),
  departureDate: z.string().describe("The trip departure date in YYYY-MM-DD format."),
  returnDate: z.string().describe("The trip return date in YYYY-MM-DD format."),
  activities: z.string().optional().describe('A brief, comma-separated list of planned activities, like "sightseeing, hiking, fine dining, swimming".'),
  travelers: z.array(TravelerSchema).min(1).describe("An array of all individuals and pets going on the trip."),
  weatherSummary: z.string().optional().describe('A summary of the expected weather conditions for the trip.'),
});
export type PackingListGeneratorInput = z.infer<typeof PackingListGeneratorInputSchema>;

const PackingListGeneratorOutputSchema = z.object({
  categories: z.array(
    z.object({
      category_name: z.string().describe("The name of the packing category (e.g., 'Clothing', 'Shared Gear', 'Electronics')."),
      items: z.array(z.string()).describe("A list of suggested items for this category, including quantities where appropriate (e.g., '3x T-shirts', '1x Toothbrush')."),
    })
  ).describe("A categorized packing list."),
});
export type PackingListGeneratorOutput = z.infer<typeof PackingListGeneratorOutputSchema>;

export async function generatePackingList(input: PackingListGeneratorInput): Promise<PackingListGeneratorOutput> {
  return packingListGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'packingListGeneratorPrompt',
  input: {schema: PackingListGeneratorInputSchema},
  output: {schema: PackingListGeneratorOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
  prompt: `You are an intelligent, meticulous travel assistant and packing expert. Your primary goal is to generate a single, consolidated, and comprehensive "master" packing list for a trip based on the provided details. The output MUST be a single JSON object that strictly follows the requested schema.

**Trip Details:**
*   **Destination:** {{{destination}}}
*   **Departure Date:** {{{departureDate}}}
*   **Return Date:** {{{returnDate}}}
*   **Planned Activities:** {{{activities}}}
{{#if weatherSummary}}
*   **Weather Context:** {{{weatherSummary}}}
{{/if}}
*   **Travelers:**
{{#each travelers}}
    - {{this.type}} ({{this.name}})
        {{#if this.age}} (Age: {{this.age}}){{/if}}
        {{#if this.notes}} - Notes: {{this.notes}}{{/if}}
{{/each}}

**Instructions:**
1.  **Assess Conditions:** Based on the **Destination**, **Dates**, and any provided **Weather Context**, determine the likely weather and environment.
2.  **Consolidate Needs:** Consider all **Travelers** and **Activities** to create a single, unified packing list for the entire group. Do NOT break the list down per traveler.
3.  **Categorize Items:** Logically group all items into clear categories like 'Clothing', 'Toiletries', 'Documents & Money', 'Electronics', 'Health & Safety', 'Shared Gear', 'Pet Supplies', etc.
4.  **Specify Quantities:** Where appropriate, include quantities in the item name (e.g., "4x T-shirts", "2x Pairs of socks per person").
5.  **JSON Output Format (Strict Requirement):**
    *   The output must be a single JSON object.
    *   The top-level key must be \`categories\`.
    *   The value of \`categories\` must be an array of objects.
    *   Each category object must have a \`category_name\` and a list of \`items\`.
    *   Do NOT include any text outside the JSON object.

Generate the consolidated master packing list now.`,
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
        throw new Error('The AI returned an empty or invalid response.');
      }
      return output;
    } catch (error: any) {
      console.error("Error in packingListGeneratorFlow:", error);
      if (error.message && error.message.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        throw new Error(
          'AI Service Error: The API key is restricted. Please go to the Google Cloud Console for your project, find the API key being used, and under "Application restrictions", ensure that "Websites" is selected and that the correct domain (e.g., your development or production URL) is added to the "Website restrictions" list. The error was: API_KEY_HTTP_REFERRER_BLOCKED.'
        );
      }
      throw new Error(`AI Service Error: ${error.message || 'An unknown error occurred.'}`);
    }
  }
);
