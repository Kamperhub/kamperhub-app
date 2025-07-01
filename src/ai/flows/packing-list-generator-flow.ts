
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
});
export type PackingListGeneratorInput = z.infer<typeof PackingListGeneratorInputSchema>;

// New schema based on user request
const PackingListGeneratorOutputSchema = z.object({
  packing_list: z.array(
    z.object({
      traveler_name: z.string(),
      traveler_type: z.string(),
      categories: z.object({
        clothing: z.array(z.string()).optional(),
        toiletries_hygiene: z.array(z.string()).optional(),
        documents_money: z.array(z.string()).optional(),
        electronics: z.array(z.string()).optional(),
        health_safety: z.array(z.string()).optional(),
        miscellaneous: z.array(z.string()).optional(),
        pet_supplies: z.array(z.string()).optional(),
        baby_supplies: z.array(z.string()).optional(),
      }),
    })
  ),
});
export type PackingListGeneratorOutput = z.infer<typeof PackingListGeneratorOutputSchema>;

export async function generatePackingList(input: PackingListGeneratorInput): Promise<PackingListGeneratorOutput> {
  return packingListGeneratorFlow(input);
}

// New prompt based on user request
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
  prompt: `You are an intelligent, meticulous travel assistant and packing expert. Your primary goal is to generate a highly personalized and comprehensive packing list based on the provided trip details. The output MUST be a single JSON object that strictly follows the requested schema.

**Trip Details:**
*   **Destination:** {{{destination}}}
*   **Departure Date:** {{{departureDate}}}
*   **Return Date:** {{{returnDate}}}
*   **Planned Activities:** {{{activities}}}
*   **Travelers:**
{{#each travelers}}
    - {{this.type}} ({{this.name}})
        {{#if this.age}} (Age: {{this.age}}){{/if}}
        {{#if this.notes}} - Notes: {{this.notes}}{{/if}}
{{/each}}

**Instructions:**
1.  **Weather and Duration Assessment:** Dynamically assess the typical weather conditions (temperature ranges, precipitation, humidity, seasonal factors) for the specified **Destination** and **Dates**. Calculate the trip duration and ensure suggestions are appropriate for the length of stay.
2.  **Activity Tailoring:** Include specific items essential for each listed **Planned Activity**. For instance: "hiking" -> hiking boots, trail snacks; "fine dining" -> semi-formal/formal attire; "swimming" -> swimwear, towel.
3.  **Traveler Personalization:** Generate a distinct packing list for *each* individual traveler. Differentiate items based on **Traveler Type** and any **specific details** provided (e.g., child's age, pet needs).
4.  **Categorization:** For each traveler's list, organize items into these exact categories: \`clothing\`, \`toiletries_hygiene\`, \`documents_money\`, \`electronics\`, \`health_safety\`, \`miscellaneous\`, \`pet_supplies\` (only if a pet is included), and \`baby_supplies\` (only if an infant/young child is included).
5.  **JSON Output Format (Strict Requirement):**
    *   The output must be a single JSON object.
    *   The top-level key must be \`packing_list\`.
    *   The value of \`packing_list\` must be an array of objects, one for each traveler.
    *   Each traveler object must have a \`traveler_name\` and \`traveler_type\` field.
    *   Each traveler object must contain a \`categories\` object, where keys are the specified category names.
    *   The value for each category key must be an array of strings, where each string is a suggested item.
    *   Be concise with item names.
    *   Do NOT include any text outside the JSON object.

Generate the packing list now.`,
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
        throw new Error('The AI returned an empty response. This can sometimes happen, please try again.');
      }
      return output;
    } catch (error: any) {
      console.error("Error in packingListGeneratorFlow:", error);
      
      // Default to the original error message if it exists.
      let errorMessageForUser = error.message || "An unknown error occurred while contacting the AI service.";

      // Try to provide a more user-friendly message for common, identifiable issues.
      const errorMessage = (error.message || '').toLowerCase();
      const causeStatus = error.cause && typeof error.cause === 'object' && 'status' in error.cause ? error.cause.status : null;
      
      if (errorMessage.includes("service unavailable") || errorMessage.includes("overloaded") || errorMessage.includes("model is overloaded") || causeStatus === 503) {
        errorMessageForUser = "The AI service is currently experiencing high demand or is temporarily unavailable. Please try again in a few moments.";
      } else if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate limit") || causeStatus === 429) {
        errorMessageForUser = "The AI service has reached its usage limit for the current period. Please try again later.";
      } else if (errorMessage.includes("api key not valid") || causeStatus === 401 || causeStatus === 403) {
          if (errorMessage.includes("httpreferrer") || errorMessage.includes("referer")) {
              errorMessageForUser = "API Key Error: Your API key is restricted by HTTP Referer. Requests from this environment are being blocked. Please check your Google Cloud Console API key settings and either remove the HTTP Referer restriction or add your development domain to the allowed list.";
          } else {
              errorMessageForUser = "There is an issue with the AI service configuration (e.g., API key not valid or permission denied). Please check the key and its permissions in your Google Cloud Console.";
          }
      } else if (errorMessage.includes("failed to parse schema") || errorMessage.includes("output_schema")) {
        errorMessageForUser = "The AI returned a response in an unexpected format. This can sometimes happen, please try again.";
      }
      
      throw new Error(errorMessageForUser);
    }
  }
);
