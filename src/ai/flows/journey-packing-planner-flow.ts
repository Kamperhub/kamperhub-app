'use server';
/**
 * @fileOverview An AI agent for generating high-level, strategic packing plans for multi-leg journeys.
 *
 * - generateJourneyPackingPlan - Generates a strategic packing plan for a whole journey.
 * - JourneyPackingPlannerInput - Input type for the journey packing planner.
 * - JourneyPackingPlannerOutput - Output type for the journey packing planner.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const JourneyPackingPlannerInputSchema = z.object({
  journeyName: z.string().describe("The name of the journey, e.g., 'The Big Lap 2025'."),
  journeyStartDate: z.string().describe("The start date of the entire journey (YYYY-MM-DD)."),
  journeyEndDate: z.string().describe("The end date of the entire journey (YYYY-MM-DD)."),
  locations: z.array(z.string()).describe("An ordered list of major locations or destinations visited during the journey, e.g., ['Brisbane, QLD', 'Sydney, NSW', 'Melbourne, VIC']."),
  activities: z.array(z.string()).optional().describe("A list of planned activities for the journey, e.g., ['beach relaxing', 'hiking', 'city tours'].")
});
export type JourneyPackingPlannerInput = z.infer<typeof JourneyPackingPlannerInputSchema>;

const JourneyPackingPlannerOutputSchema = z.object({
  strategicAdvice: z.string().describe("A markdown-formatted text block providing a high-level strategic packing plan. It should advise on packing zones (e.g., long-term vs. immediate access) and what types of gear will be needed at different stages of the journey based on the locations and dates."),
});
export type JourneyPackingPlannerOutput = z.infer<typeof JourneyPackingPlannerOutputSchema>;

export async function generateJourneyPackingPlan(input: JourneyPackingPlannerInput): Promise<JourneyPackingPlannerOutput> {
  return journeyPackingPlannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'journeyPackingPlannerPrompt',
  input: {schema: JourneyPackingPlannerInputSchema},
  output: {schema: JourneyPackingPlannerOutputSchema},
  prompt: `You are a world-class, expert logistics planner for long-distance caravan journeys. Your task is to provide a high-level, strategic packing plan for a multi-stage journey. Do NOT generate a detailed, item-by-item checklist. Instead, provide strategic advice on how to organize packing for a long trip with varying climates and activities.

**Journey Details:**
- **Name:** {{{journeyName}}}
- **Dates:** From {{{journeyStartDate}}} to {{{journeyEndDate}}}
- **Route Summary:** A journey through the following locations, in order: {{#each locations}}{{{this}}}{{#unless @last}}, then {{/unless}}{{/each}}.
- **Planned Activities:** {{#if activities}}{{#each activities}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}General touring and relaxation{{/if}}.

**Instructions:**
1.  **Analyze the Itinerary:** Based on the locations and dates, infer the likely seasons and climates that will be encountered (e.g., "Starting in the Queensland summer, travelling south into the Victorian autumn...").
2.  **Identify Packing Zones:** Recommend a strategy for organizing the caravan. Suggest 'packing zones' such as "Immediate Access" (for daily items), "Medium-Term Storage" (for gear needed in a few weeks), and "Deep Storage" (for items not needed for months).
3.  **Provide Strategic Advice:** Write a concise, markdown-formatted summary. For example: "For your journey from the warm north to the cooler south, pack your winter clothing (puffer jackets, thermals) in your 'Deep Storage' area. You won't need these until you reach Victoria. Keep your beach gear and summer clothes in 'Immediate Access' for the initial Queensland and NSW legs."
4.  **Focus on the Big Picture:** The output should be a single text block of strategic advice, not a list of individual items. The goal is to help the user pack the caravan intelligently for a long, evolving trip.

Generate the strategic packing advice now.
`,
});

const journeyPackingPlannerFlow = ai.defineFlow(
  {
    name: 'journeyPackingPlannerFlow',
    inputSchema: JourneyPackingPlannerInputSchema,
    outputSchema: JourneyPackingPlannerOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
      }
      return output;
    } catch (error: any)
    {
      console.error("Error in journeyPackingPlannerFlow:", error);
      throw new Error(`AI Service Error: ${error.message || 'An unknown error occurred.'}`);
    }
  }
);
