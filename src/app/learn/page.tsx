
"use client";

import Link from 'next/link'; 
import { VideoCard } from '@/components/features/learn/VideoCard';
import { ArticleDisplayCard } from '@/components/features/learn/ArticleDisplayCard';
import { UserManualContent } from '@/components/features/learn/UserManualContent'; 
import { TermsOfServiceContent } from '@/components/features/learn/TermsOfServiceContent';
import { sampleVideos, staticCaravanningArticles, type AiGeneratedArticle } from '@/types/learn'; 
import { FileText, Youtube, Video, BookText, FileLock2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articles: AiGeneratedArticle[] = staticCaravanningArticles;

  const validTabs = ["videos", "articles", "manual", "tos"] as const;
  type ValidTab = typeof validTabs[number];
  const defaultTab: ValidTab = "videos";

  const [activeTab, setActiveTab] = useState<ValidTab>(() => {
    const tabFromQuery = searchParams.get('tab') as ValidTab | null;
    return tabFromQuery && validTabs.includes(tabFromQuery) ? tabFromQuery : defaultTab;
  });

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab') as ValidTab | null;
    const newTabBasedOnQuery = tabFromQuery && validTabs.includes(tabFromQuery) ? tabFromQuery : defaultTab;
    if (newTabBasedOnQuery !== activeTab) {
      setActiveTab(newTabBasedOnQuery);
    }
  }, [searchParams, activeTab]); 

  const handleTabChange = (newTabValue: string) => {
    if (validTabs.includes(newTabValue as ValidTab)) {
      const newTab = newTabValue as ValidTab;
      setActiveTab(newTab);
      router.push(`/learn?tab=${newTab}`, { scroll: false });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary">KamperHub Support Center</h1>
        <p className="text-muted-foreground font-body mb-6">
          Find helpful videos, articles, the user manual, and terms of service. For AI assistance, please visit our dedicated Chatbot page.
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 mb-6">
          <TabsTrigger 
            value="videos" 
            className="font-body text-xs xxs:text-sm sm:text-base whitespace-normal sm:whitespace-nowrap h-auto py-2"
          >
            <Video className="mr-1 xxs:mr-2 h-4 w-4 xxs:h-5 xxs:w-5" /> Educational Videos
          </TabsTrigger>
          <TabsTrigger 
            value="articles" 
            className="font-body text-xs xxs:text-sm sm:text-base whitespace-normal sm:whitespace-nowrap h-auto py-2"
          >
            <FileText className="mr-1 xxs:mr-2 h-4 w-4 xxs:h-5 xxs:w-5" /> Articles & Guides
          </TabsTrigger>
          <TabsTrigger 
            value="manual" 
            className="font-body text-xs xxs:text-sm sm:text-base whitespace-normal sm:whitespace-nowrap h-auto py-2"
          >
            <BookText className="mr-1 xxs:mr-2 h-4 w-4 xxs:h-5 xxs:w-5" /> User Manual
          </TabsTrigger>
          <TabsTrigger 
            value="tos" 
            className="font-body text-xs xxs:text-sm sm:text-base whitespace-normal sm:whitespace-nowrap h-auto py-2"
          >
            <FileLock2 className="mr-1 xxs:mr-2 h-4 w-4 xxs:h-5 xxs:w-5" /> Terms of Service
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <div className="bg-card p-6 rounded-lg shadow-sm border"> 
            <div className="mb-4"> 
              <h2 className="font-headline text-2xl text-primary flex items-center mb-1"> 
                <Youtube className="h-7 w-7 text-primary mr-3" />
                Educational Videos
              </h2>
              <p className="text-muted-foreground font-body">
                Browse our curated list of YouTube videos to learn more about caravanning.
              </p>
            </div>
            <div> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sampleVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="articles">
           <div className="bg-card p-6 rounded-lg shadow-sm border"> 
            <div className="mb-4"> 
              <h2 className="font-headline text-2xl text-primary flex items-center mb-1"> 
                <FileText className="h-7 w-7 text-primary mr-3" />
                Articles & Guides
              </h2>
              <p className="text-muted-foreground font-body">
                Helpful articles and guides covering various caravanning topics.
              </p>
            </div>
            <div> 
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

        <TabsContent value="manual">
          <div className="bg-card p-0 sm:p-6 rounded-lg shadow-sm border">
            <div className="mb-0 sm:mb-4 px-6 pt-6 sm:p-0"> 
              <h2 className="font-headline text-2xl text-primary flex items-center mb-1"> 
                <BookText className="h-7 w-7 text-primary mr-3" />
                User Manual
              </h2>
              <p className="text-muted-foreground font-body">
                Your complete guide to using KamperHub.
              </p>
            </div>
            <div className="px-0 sm:px-2"> 
              <ScrollArea className="h-[calc(100vh-300px)] sm:h-[calc(100vh-350px)] pr-0 sm:pr-4">
                <UserManualContent />
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tos">
          <div className="bg-card p-0 sm:p-6 rounded-lg shadow-sm border">
            <div className="mb-0 sm:mb-4 px-6 pt-6 sm:p-0"> 
              <h2 className="font-headline text-2xl text-primary flex items-center mb-1"> 
                <FileLock2 className="h-7 w-7 text-primary mr-3" />
                Terms of Service
              </h2>
              <p className="text-muted-foreground font-body">
                Please review our terms and conditions.
              </p>
            </div>
            <div className="px-0 sm:px-2"> 
              <ScrollArea className="h-[calc(100vh-300px)] sm:h-[calc(100vh-350px)] pr-0 sm:pr-4">
                <TermsOfServiceContent />
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
