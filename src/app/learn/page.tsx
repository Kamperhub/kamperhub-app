
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
      setShowRateLimitError(false);
      const newArticles: AiGeneratedArticle[] = [];
      const errors: string[] = [];

      for (const topic of articleTopics) {
        try {
          const input: ArticleGeneratorInput = { topic };
          const article = await generateCaravanningArticle(input);
          newArticles.push(article);
        } catch (error: any) {
          console.error(`Failed to generate article for topic "${topic}":`, error);
          if (error.message && (error.message.includes("429") || error.message.toLowerCase().includes("quota"))) {
            setShowRateLimitError(true);
            errors.push(`Article for "${topic}" failed due to API rate limits.`);
          } else {
            errors.push(`Could not generate article for: ${topic}.`);
          }
        }
      }
      setGeneratedArticles(newArticles);
      setArticleErrors(errors);
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
              <p key={index} className="text-destructive font-body">{errorMsg}</p>
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
