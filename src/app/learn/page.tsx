
"use client";

import Link from 'next/link'; // Keep Link for other potential uses, or remove if truly unused.
import { VideoCard } from '@/components/features/learn/VideoCard';
import { ArticleDisplayCard } from '@/components/features/learn/ArticleDisplayCard';
import { sampleVideos, staticCaravanningArticles, type AiGeneratedArticle } from '@/types/learn'; 
import { ChatInterface } from '@/components/features/chatbot/ChatInterface'; // Import ChatInterface
import { FileText, Youtube, MessageSquare, Video } from 'lucide-react'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Button might still be used if we keep other parts, but likely not for the chatbot tab now.
// import { Button } from "@/components/ui/button"; 
// Card, CardContent, CardHeader, CardTitle might not be needed for chatbot tab.
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function SupportPage() {
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
          <TabsTrigger value="articles" className="font-body text-sm sm:text-base">
            <FileText className="mr-2 h-5 w-5" /> Articles & Guides
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="font-body text-sm sm:text-base">
            <MessageSquare className="mr-2 h-5 w-5" /> AI Chatbot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <div className="bg-card p-6 rounded-lg shadow-sm border"> {/* Replaced Card with div for simpler structure if needed */}
            <div className="mb-4"> {/* Replaced CardHeader */}
              <h2 className="font-headline text-2xl text-primary flex items-center mb-1"> {/* Replaced CardTitle */}
                <Youtube className="h-7 w-7 text-primary mr-3" />
                Educational Videos
              </h2>
              <p className="text-muted-foreground font-body">
                Browse our curated list of YouTube videos to learn more about caravanning.
              </p>
            </div>
            <div> {/* Replaced CardContent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sampleVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="articles">
           <div className="bg-card p-6 rounded-lg shadow-sm border"> {/* Replaced Card */}
            <div className="mb-4"> {/* Replaced CardHeader */}
              <h2 className="font-headline text-2xl text-primary flex items-center mb-1"> {/* Replaced CardTitle */}
                <FileText className="h-7 w-7 text-primary mr-3" />
                Articles & Guides
              </h2>
              <p className="text-muted-foreground font-body">
                Helpful articles and guides covering various caravanning topics.
              </p>
            </div>
            <div> {/* Replaced CardContent */}
              {articles.length === 0 ? (
                <p className="text-muted-foreground font-body text-center py-6">No articles available at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {articles.map((article, index) => (
                    <ArticleDisplayCard key={index} article={article} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chatbot">
          {/* Directly embed the ChatInterface component */}
          <ChatInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}
