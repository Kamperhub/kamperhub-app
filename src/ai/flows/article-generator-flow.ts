
'use server';
/**
 * @fileOverview AI agent for generating articles on caravanning topics.
 *
 * - generateCaravanningArticle - A function that generates an article.
 * - ArticleGeneratorInput - The input type for the article generation.
 * - ArticleGeneratorOutput - The output type for the article generation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ArticleGeneratorInputSchema = z.object({
  topic: z.string().describe('The specific caravanning topic for the article.'),
});
export type ArticleGeneratorInput = z.infer<typeof ArticleGeneratorInputSchema>;

const ArticleGeneratorOutputSchema = z.object({
  topic: z.string().describe('The original topic this article is about.'),
  title: z.string().describe('A concise and engaging title for the article. Should be suitable for an H2 or H3 heading.'),
  introduction: z.string().describe('A brief introduction to the topic, around 2-3 sentences.'),
  sections: z.array(z.object({ 
    heading: z.string().describe('A clear heading for this section of the article. Should be suitable for an H4 heading.'), 
    content: z.string().describe('The main content for this section, ideally 2-4 paragraphs. Provide practical and actionable advice if applicable.') 
  })).min(2).max(4).describe('An array of 2 to 4 informative sections, each with a heading and content.'),
  conclusion: z.string().describe('A concluding paragraph summarizing the key points or offering final advice, around 2-3 sentences.'),
});
export type ArticleGeneratorOutput = z.infer<typeof ArticleGeneratorOutputSchema>;

export async function generateCaravanningArticle(input: ArticleGeneratorInput): Promise<ArticleGeneratorOutput> {
  return articleGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'caravanningArticleGeneratorPrompt',
  input: {schema: ArticleGeneratorInputSchema},
  output: {schema: ArticleGeneratorOutputSchema},
  prompt: `You are an expert writer specializing in creating helpful and informative articles for caravan enthusiasts, particularly novices.
Your task is to generate an article on the following topic: {{{topic}}}

Please structure the article with:
1.  A 'title' that is catchy and relevant.
2.  An 'introduction' that briefly introduces the topic.
3.  Between 2 and 4 'sections', each with its own 'heading' and 'content'. The content for each section should be detailed and practical.
4.  A 'conclusion' that summarizes the main points.

Ensure the tone is friendly, encouraging, and easy to understand for beginners.
Focus on providing actionable tips and clear explanations.
The original 'topic' must be included in the output.
Output the article in the structured format defined by the output schema.
`,
});

const articleGeneratorFlow = ai.defineFlow(
  {
    name: 'articleGeneratorFlow',
    inputSchema: ArticleGeneratorInputSchema,
    outputSchema: ArticleGeneratorOutputSchema,
  },
  async (input: ArticleGeneratorInput): Promise<ArticleGeneratorOutput> => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        console.warn('ArticleGeneratorFlow: AI model returned null output. This might be due to schema mismatch or other non-fatal errors from the model.');
        throw new Error('The AI returned an empty response. This can sometimes happen, please try again.');
      }
      return { ...output, topic: input.topic };
    } catch (error: any) {
      console.error("Error in articleGeneratorFlow:", error);
      
      let errorMessageForUser = "An unexpected error occurred while generating the article. Please try again.";
      if (error.message) {
        const errorMessage = error.message.toLowerCase();
        const causeStatus = error.cause && typeof error.cause === 'object' && 'status' in error.cause ? error.cause.status : null;
        
        if (errorMessage.includes("service unavailable") || errorMessage.includes("overloaded") || errorMessage.includes("model is overloaded") || causeStatus === 503) {
          errorMessageForUser = "The AI service is currently experiencing high demand or is temporarily unavailable. Please try again in a few moments.";
        } else if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate limit") || causeStatus === 429) {
          errorMessageForUser = "The AI service has reached its usage limit for the current period. Please try again later.";
        } else if (errorMessage.includes("api key not valid") || causeStatus === 401 || causeStatus === 403) {
            if (errorMessage.includes("httpreferrer") || errorMessage.includes("referer")) {
                errorMessageForUser = "API Key Error: Your API key is restricted by HTTP Referer. Requests from this environment (likely localhost or a server without a referer) are being blocked. Please check your Google Cloud Console API key settings and either remove the HTTP Referer restriction or add your development domain to the allowed list.";
            } else {
                errorMessageForUser = "There is an issue with the AI service configuration (e.g., API key not valid or permission denied). Please check the key and its permissions in your Google Cloud Console.";
            }
        } else if (errorMessage.includes("failed to parse schema") || errorMessage.includes("output_schema")) {
          errorMessageForUser = "The AI returned a response in an unexpected format. This can sometimes happen, please try again.";
        } else if (error.message) { // Use the original error message if it's not one of the known types
          errorMessageForUser = error.message;
        }
      }
      
      throw new Error(errorMessageForUser);
    }
  }
);
