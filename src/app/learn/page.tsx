"use client";

import Link from 'next/link'; 
import { ArticleDisplayCard } from '@/components/features/learn/ArticleDisplayCard';
import { UserManualContent } from '@/components/features/learn/UserManualContent'; 
import { TermsOfServiceContent } from '@/components/features/learn/TermsOfServiceContent';
import { GettingStartedGuide } from '@/components/features/dashboard/GettingStartedGuide';
import { staticCaravanningArticles, type AiGeneratedArticle } from '@/types/learn'; 
import { FileText, BookText, FileLock2, Rocket } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articles: AiGeneratedArticle[] = staticCaravanningArticles;

  const validTabs = ["guide", "articles", "manual", "tos"] as const;
  type ValidTab = typeof validTabs[number];
  const defaultTab: ValidTab = "guide";

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

  const tabTriggerBaseStyles = "font-body text-xs xxs:text-sm sm:text-base whitespace-normal sm:whitespace-nowrap h-auto py-2";
  const tabTriggerInactiveStyles = "text-muted-foreground hover:text-primary hover:bg-primary/10";
  const tabTriggerActiveStyles = "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md";


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary">KamperHub Support Center</h1>
        <p className="text-muted-foreground font-body mb-6">
          Find resources to help you with your caravanning journey. For AI assistance, please visit our dedicated Chatbot page.
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 mb-6 bg-background">
          <TabsTrigger 
            value="guide" 
            className={`${tabTriggerBaseStyles} ${tabTriggerInactiveStyles} ${tabTriggerActiveStyles}`}
          >
            <Rocket className="mr-1 xxs:mr-2 h-4 w-4 xxs:h-5 xxs:w-5" /> Getting Started
          </TabsTrigger>
          <TabsTrigger 
            value="articles" 
            className={`${tabTriggerBaseStyles} ${tabTriggerInactiveStyles} ${tabTriggerActiveStyles}`}
          >
            <FileText className="mr-1 xxs:mr-2 h-4 w-4 xxs:h-5 xxs:w-5" /> Articles
          </TabsTrigger>
          <TabsTrigger 
            value="manual" 
            className={`${tabTriggerBaseStyles} ${tabTriggerInactiveStyles} ${tabTriggerActiveStyles}`}
          >
            <BookText className="mr-1 xxs:mr-2 h-4 w-4 xxs:h-5 xxs:w-5" /> Manual
          </TabsTrigger>
          <TabsTrigger 
            value="tos" 
            className={`${tabTriggerBaseStyles} ${tabTriggerInactiveStyles} ${tabTriggerActiveStyles}`}
          >
            <FileLock2 className="mr-1 xxs:mr-2 h-4 w-4 xxs:h-5 xxs:w-5" /> Terms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide">
          <GettingStartedGuide onDismiss={() => {}} isDismissing={false} showDismissButton={false}/>
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
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <ScrollArea className="h-[calc(100vh-350px)] pr-4">
              <UserManualContent />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="tos">
           <div className="bg-card p-6 rounded-lg shadow-sm border">
            <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                <TermsOfServiceContent />
            </ScrollArea>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
