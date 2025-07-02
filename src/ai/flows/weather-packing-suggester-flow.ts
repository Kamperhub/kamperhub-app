
'use server';
/**
 * @fileOverview AI agent for generating weather-based packing suggestions.
 *
 * - generateWeatherPackingSuggestions - A function that generates a weather summary and packing tips.
 * - WeatherPackingSuggesterInput - The input type for the function.
 * - WeatherPackingSuggesterOutput - The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const WeatherPackingSuggesterInputSchema = z.object({
  destination: z.string().describe('The primary destination of the trip (e.g., "Cairns, QLD", "Tasmanian Coast").'),
  tripMonth: z.string().describe('The month of the trip (e.g., "January", "July"). This provides seasonal context.'),
  durationInDays: z.number().int().positive().describe('The total number of days for the trip.'),
});
type WeatherPackingSuggesterInput = z.infer<typeof WeatherPackingSuggesterInputSchema>;

const WeatherPackingSuggesterOutputSchema = z.object({
  weatherSummary: z.string().describe("A brief, helpful summary of the typical weather for the destination and month."),
  suggestedItems: z.array(z.object({
    itemName: z.string().describe("The name of the individual item to suggest packing."),
    notes: z.string().optional().describe("A brief, helpful note explaining why this item is suggested."),
  })).describe("A list of specific items to pack based on the typical weather."),
});
type WeatherPackingSuggesterOutput = z.infer<typeof WeatherPackingSuggesterOutputSchema>;

export async function generateWeatherPackingSuggestions(input: WeatherPackingSuggesterInput): Promise<WeatherPackingSuggesterOutput> {
  return weatherPackingSuggesterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weatherPackingSuggesterPrompt',
  input: { schema: WeatherPackingSuggesterInputSchema },
  output: { schema: WeatherPackingSuggesterOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
  prompt: `You are a travel assistant for Australian caravanning trips. Your task is to provide a weather summary and specific packing suggestions based on a destination and time of year.

**Trip Details:**
*   **Destination:** {{{destination}}}
*   **Month of Travel:** {{{tripMonth}}}
*   **Duration:** {{{durationInDays}}} days

**Instructions:**
1.  **Generate a Weather Summary:** Based on general knowledge of Australian climate, write a short summary (2-3 sentences) of the typical weather for the given destination and month. For example, "July in Melbourne is typically cold and can be wet. Expect cool days and chilly nights."
2.  **Suggest Packing Items:** Provide a list of 5-8 specific, essential packing items tailored to that weather. For each item, include a brief 'note' explaining its purpose. For example, for a cold destination, suggest "Beanie" with a note "Essential for keeping warm, especially at night."
3.  **Be Practical:** Focus on items directly related to the likely weather conditions.

Generate the summary and suggestions now.
`,
});

const weatherPackingSuggesterFlow = ai.defineFlow(
  {
    name: 'weatherPackingSuggesterFlow',
    inputSchema: WeatherPackingSuggesterInputSchema,
    outputSchema: WeatherPackingSuggesterOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
      }
      return output;
    } catch (error: any) {
      console.error("Error in weatherPackingSuggesterFlow:", error);
      if (error.message && error.message.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        throw new Error(
          'AI Service Error: The GOOGLE_API_KEY you are using has "HTTP referrer" restrictions, which is not allowed for server-to-server AI calls. Please use a different API key that does NOT have this restriction type. A key with "None", "IP Address", or only API service restrictions will work. The error was: API_KEY_HTTP_REFERRER_BLOCKED.'
        );
      }
      throw new Error(`AI Service Error: ${error.message || 'An unknown error occurred.'}`);
    }
  }
);
