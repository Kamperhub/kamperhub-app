
"use client";

import { useState } from 'react'; // Removed useEffect
import Link from 'next/link';
import { VideoCard } from '@/components/features/learn/VideoCard';
import { ArticleDisplayCard } from '@/components/features/learn/ArticleDisplayCard';
import { sampleVideos, staticCaravanningArticles, type AiGeneratedArticle } from '@/types/learn'; // Import staticCaravanningArticles
// Removed generateCaravanningArticle and ArticleGeneratorInput imports
import { FileText, Youtube, MessageSquare, Video } from 'lucide-react'; // Removed Loader2, AlertTriangle
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Removed Alert, AlertTitle, AlertDescription related to AI errors

export default function SupportPage() {
  // Articles are now static, no loading or error states needed for them here
  const articles: AiGeneratedArticle[] = staticCaravanningArticles;

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
          <TabsTrigger value="articles" className="font-body text-sm sm:text-base"> {/* Changed value and label */}
            <FileText className="mr-2 h-5 w-5" /> Articles & Guides
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

        <TabsContent value="articles"> {/* Changed value */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <FileText className="h-7 w-7 text-primary mr-3" />
                Articles & Guides {/* Changed title */}
              </CardTitle>
              <p className="text-muted-foreground font-body">
                Helpful articles and guides covering various caravanning topics.
              </p>
            </CardHeader>
            <CardContent>
              {articles.length === 0 ? (
                <p className="text-muted-foreground font-body text-center py-6">No articles available at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {articles.map((article, index) => (
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
