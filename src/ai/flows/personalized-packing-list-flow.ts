'use server';
/**
 * @fileOverview AI agent for generating personalized packing lists for multiple passengers.
 *
 * - generatePersonalizedPackingLists - A function that generates personalized lists and formats them for messaging and Google Tasks.
 * - PersonalizedPackingListInput - The input type for the function.
 * - PersonalizedPackingListOutput - The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the schema for a single passenger in the input
const PassengerInputSchema = z.object({
  id: z.string().describe("Unique identifier for the passenger."),
  name: z.string().describe("The passenger's name."),
  type: z.string().describe("Type of passenger, e.g., 'Adult', 'Child (age 8)'.") ,
  specific_needs: z.array(z.string()).describe("A list of specific needs, preferences, or items for this passenger.")
});

// Define the main input schema for the flow
const PersonalizedPackingListInputSchema = z.object({
  trip_details: z.object({
    name: z.string().describe("The name of the trip, e.g., 'KamperHub Yellowstone Adventure'."),
    dates: z.string().describe("The dates of the trip, e.g., 'August 1-7, 2025'."),
    location_summary: z.string().describe("A brief summary of the location's weather and conditions.")
  }),
  master_packing_list: z.record(z.array(z.string())).describe("A master list of items, categorized. Shared items should be marked with '(shared)'."),
  passengers: z.array(PassengerInputSchema).describe("An array of passenger objects.")
});
export type PersonalizedPackingListInput = z.infer<typeof PersonalizedPackingListInputSchema>;


// Define the schema for the Google Tasks structure in the output
const GoogleTasksStructureSchema = z.object({
  trip_task_name: z.string().describe("The top-level task name for Google Tasks, e.g., 'Trip Name - Passenger Name's Packing List'."),
  categories: z.array(z.object({
    category_name: z.string().describe("The name of the packing category, e.g., 'Clothing'."),
    items: z.array(z.string()).describe("An array of individual item strings for this category.")
  })).describe("An array of category objects, each containing a list of items.")
});
export type GoogleTasksStructure = z.infer<typeof GoogleTasksStructureSchema>;

// Define the schema for a single passenger's output
const PassengerListOutputSchema = z.object({
  passenger_id: z.string().describe("The unique identifier for the passenger."),
  passenger_name: z.string().describe("The passenger's name."),
  messenger_message: z.string().describe("A friendly, personalized message string suitable for a messaging service."),
  google_tasks_structure: GoogleTasksStructureSchema.describe("A structured JSON object for programmatic Google Tasks creation.")
});

// Define the main output schema for the flow
const PersonalizedPackingListOutputSchema = z.object({
  passenger_lists: z.array(PassengerListOutputSchema).describe("An array of personalized list objects, one for each passenger.")
});
export type PersonalizedPackingListOutput = z.infer<typeof PersonalizedPackingListOutputSchema>;

const prompt = ai.definePrompt({
  name: 'personalizedPackingListPrompt',
  input: {schema: PersonalizedPackingListInputSchema},
  output: {schema: PersonalizedPackingListOutputSchema},
  prompt: `You are an expert travel assistant for 'KamperHub'. Your task is to take a master packing list and personalize it for each passenger.

**Critical Rule:** If there is only one passenger in the list, you MUST throw an error with the exact message: "Personalization is not needed for a single passenger." This is a hard rule.

**Trip Details:**
- **Name:** {{trip_details.name}}
- **Dates:** {{trip_details.dates}}
- **Location Summary:** {{trip_details.location_summary}}

**Master Packing List:**
{{#each master_packing_list}}
**Category: {{@key}}**
{{#each this}}
- {{this}}
{{/each}}
{{/each}}

**Passengers:**
{{#each passengers}}
- **Passenger Name:** {{this.name}} (ID: {{this.id}})
  - **Type:** {{this.type}}
  {{#if this.specific_needs}}
  - **Specific Needs:** {{#each this.specific_needs}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/if}}
{{/each}}

**Output Generation Rules:**

1.  **messenger_message:** A friendly, personalized message.
    -   Start with a greeting.
    -   Mention trip name and dates.
    -   List only items relevant to that specific passenger.
    -   Categorize items clearly.
    -   Add a brief, personalized closing remark.
    -   Ensure conciseness for mobile.

2.  **google_tasks_structure:** A structured JSON object for Google Tasks.
    -   \`trip_task_name\` should be "[Trip Name] - [Passenger Name]'s Packing List".
    -   Create sub-tasks for each category.
    -   Under each category, create sub-tasks for each individual item.
    -   Exclude shared items (marked with "(shared)") from individual lists.

Your final output MUST be a single JSON object containing an array of \`passenger_lists\`. Do not call any tools.
`,
});

const personalizedPackingListFlow = ai.defineFlow(
  {
    name: 'personalizedPackingListFlow',
    inputSchema: PersonalizedPackingListInputSchema,
    outputSchema: PersonalizedPackingListOutputSchema,
  },
  async (input) => {
    try {
      if (input.passengers.length <= 1) {
        throw new Error("Personalization is not needed for a single passenger.");
      }
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
      }
      return output;
    } catch (error: any) {
      console.error("Error in personalizedPackingListFlow:", error);
       if (error.message && error.message.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        throw new Error(
          'AI Service Error: The GOOGLE_API_KEY has "HTTP referrer" restrictions, which is not allowed for server-to-server AI calls. Use a key with "None" or "IP Address" restrictions as explained in the setup guide.'
        );
      }
      throw new Error(`AI Service Error: ${error.message || 'An unknown error occurred.'}`);
    }
  }
);

export async function generatePersonalizedPackingLists(input: PersonalizedPackingListInput): Promise<PersonalizedPackingListOutput> {
  return personalizedPackingListFlow(input);
}
