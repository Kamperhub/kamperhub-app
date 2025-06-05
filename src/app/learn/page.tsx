
"use client";

import { useState, useEffect } from 'react';
import { VideoCard } from '@/components/features/learn/VideoCard';
import { ArticleDisplayCard } from '@/components/features/learn/ArticleDisplayCard';
import { sampleVideos, type AiGeneratedArticle } from '@/types/learn';
import { generateCaravanningArticle, type ArticleGeneratorInput } from '@/ai/flows/article-generator-flow';
import { Loader2, FileText, Youtube, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const articleTopics: string[] = [
  "Essential Pre-Departure Caravan Checks",
  "Tips for Reversing a Caravan Safely",
  "Understanding Caravan Tow Ball Weight",
];

export default function LearnPage() {
  const [generatedArticles, setGeneratedArticles] = useState<AiGeneratedArticle[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [articleErrors, setArticleErrors] = useState<string[]>([]);
  const [showRateLimitError, setShowRateLimitError] = useState(false);

  useEffect(() => {
    async function fetchArticles() {
      setIsLoadingArticles(true);
      setShowRateLimitError(false); // Reset per fetch attempt
      const newArticles: AiGeneratedArticle[] = [];
      const localErrors: string[] = [];

      for (const topic of articleTopics) {
        try {
          const input: ArticleGeneratorInput = { topic };
          const article = await generateCaravanningArticle(input);
          newArticles.push(article);
        } catch (error: any) {
          console.error(`Failed to generate article for topic "${topic}":`, error);
          if (error.message && error.message.startsWith("RATE_LIMIT_EXCEEDED")) {
            setShowRateLimitError(true);
            localErrors.push(`Article for "${topic}" could not be generated due to API rate limits. Please check your Gemini API quota and billing details.`);
            // Optionally, break here if one rate limit error means all subsequent calls will also fail
            // break; 
          } else if (error.message && error.message.startsWith("AI_MODEL_OUTPUT_ERROR")) {
            localErrors.push(`Article for "${topic}" generation issue: Model did not return expected output. Details: ${error.message}`);
          } else if (error.message && error.message.startsWith("AI_PROMPT_ERROR")) {
            localErrors.push(`Article for "${topic}" generation failed: Error calling AI prompt. Details: ${error.message}`);
          }
          else { // Fallback for other generic errors
            localErrors.push(`Could not generate article for "${topic}". An unexpected error occurred: ${error.message || 'Unknown error'}`);
          }
        }
      }
      setGeneratedArticles(newArticles);
      setArticleErrors(localErrors);
      setIsLoadingArticles(false);
    }
    fetchArticles();
  }, []);

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center mb-6">
          <Youtube className="h-10 w-10 text-primary mr-3" />
          <div>
            <h1 className="text-3xl font-headline text-primary">Educational Videos</h1>
            <p className="text-muted-foreground font-body">
              Browse our curated list of YouTube videos to learn more about caravanning.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sampleVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center mb-6">
          <FileText className="h-10 w-10 text-primary mr-3" />
           <div>
            <h2 className="text-3xl font-headline text-primary">Generated Articles</h2>
            <p className="text-muted-foreground font-body">
              AI-powered articles covering various caravanning topics. Refreshed by the developer.
            </p>
          </div>
        </div>

        {showRateLimitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-headline">API Rate Limit Exceeded</AlertTitle>
            <AlertDescription className="font-body">
              Article generation is temporarily unavailable because the API usage limits have been reached. 
              Please check your Google Cloud project's Gemini API quotas and billing details. You may need to wait or upgrade your plan.
              Some articles may not have loaded.
            </AlertDescription>
          </Alert>
        )}

        {isLoadingArticles && (
          <div className="grid grid-cols-1 gap-6">
            {articleTopics.map(topic => (
              <Card key={topic} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                    <p className="font-body text-lg">Generating article on: {topic}...</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {!isLoadingArticles && articleErrors.length > 0 && (
          <div className="space-y-2 mb-4">
            {articleErrors.map((errorMsg, index) => (
               <Alert key={index} variant="default" className="bg-orange-50 border-orange-300 text-orange-700">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <AlertTitle className="font-headline text-orange-700">Article Generation Issue</AlertTitle>
                <AlertDescription className="font-body">{errorMsg}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        {!isLoadingArticles && generatedArticles.length === 0 && articleErrors.length === 0 && !showRateLimitError && (
          <p className="text-muted-foreground font-body text-center py-6">No articles generated yet, or an issue occurred.</p>
        )}
        {!isLoadingArticles && generatedArticles.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {generatedArticles.map((article, index) => (
              <ArticleDisplayCard key={index} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

