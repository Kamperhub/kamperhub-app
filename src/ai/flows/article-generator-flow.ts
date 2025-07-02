
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
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
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
        throw new Error('The AI returned an empty or invalid response.');
      }
      return { ...output, topic: input.topic };
    } catch (error: any) {
      console.error("Error in articleGeneratorFlow:", error);
      if (error.message && error.message.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        throw new Error(
          'AI Service Error: The GOOGLE_API_KEY has "HTTP referrer" restrictions, which is not allowed for server-to-server AI calls. Use a key with "None" or "IP Address" restrictions as explained in the setup guide.'
        );
      }
      throw new Error(`AI Service Error: ${error.message || 'An unknown error occurred.'}`);
    }
  }
);
