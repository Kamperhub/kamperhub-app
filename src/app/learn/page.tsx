
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VideoCard } from '@/components/features/learn/VideoCard';
import { ArticleDisplayCard } from '@/components/features/learn/ArticleDisplayCard';
import { sampleVideos, type AiGeneratedArticle } from '@/types/learn';
import { generateCaravanningArticle, type ArticleGeneratorInput } from '@/ai/flows/article-generator-flow';
import { Loader2, FileText, Youtube, AlertTriangle, MessageSquare, Video } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const articleTopics: string[] = [
  "Essential Pre-Departure Caravan Checks",
  "Tips for Reversing a Caravan Safely",
  "Understanding Caravan Tow Ball Weight",
];

export default function SupportPage() {
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
          } else if (error.message && error.message.startsWith("AI_MODEL_OUTPUT_ERROR")) {
            localErrors.push(`Article for "${topic}" generation issue: Model did not return expected output. Details: ${error.message}`);
          } else if (error.message && error.message.startsWith("AI_PROMPT_ERROR")) {
            localErrors.push(`Article for "${topic}" generation failed: Error calling AI prompt. Details: ${error.message}`);
          }
          else {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary">KamperHub Support Center</h1>
        <p className="text-muted-foreground font-body mb-6">
          Find helpful videos, articles, and get your questions answered by our AI assistant.
        </p>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="videos" className="font-body text-sm sm:text-base">
            <Video className="mr-2 h-5 w-5" /> Educational Videos
          </TabsTrigger>
          <TabsTrigger value="blogs" className="font-body text-sm sm:text-base">
            <FileText className="mr-2 h-5 w-5" /> AI Generated Blogs
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="font-body text-sm sm:text-base">
            <MessageSquare className="mr-2 h-5 w-5" /> AI Chatbot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <Youtube className="h-7 w-7 text-primary mr-3" />
                Educational Videos
              </CardTitle>
              <p className="text-muted-foreground font-body">
                Browse our curated list of YouTube videos to learn more about caravanning.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sampleVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blogs">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <FileText className="h-7 w-7 text-primary mr-3" />
                AI Generated Blogs
              </CardTitle>
              <p className="text-muted-foreground font-body">
                AI-powered articles covering various caravanning topics. Content is generated on page load and may vary.
              </p>
            </CardHeader>
            <CardContent>
              {showRateLimitError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="font-headline">API Rate Limit Exceeded</AlertTitle>
                  <AlertDescription className="font-body">
                    Article generation is temporarily unavailable because the API usage limits have been reached. 
                    Please check your Google Cloud project's Gemini API quotas and billing details. Some articles may not have loaded.
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatbot">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <MessageSquare className="h-7 w-7 text-primary mr-3" />
                AI Chatbot Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground font-body">
                Have specific questions about caravanning? Our AI assistant is ready to help! 
                Ask about maintenance, troubleshooting, destinations, or anything else related to your adventures.
              </p>
              <Link href="/chatbot" passHref>
                <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-body text-lg py-3">
                  Go to AI Chatbot
                </Button>
              </Link>
               <div className="mt-6 p-4 bg-muted/20 rounded-md flex items-center justify-center h-48">
                  <MessageSquare className="w-24 h-24 text-primary opacity-30" />
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
