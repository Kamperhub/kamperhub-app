"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ChatInterfaceLoadingSkeleton = () => (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px] bg-card shadow-lg rounded-lg border">
      <div className="flex-grow p-4 space-y-4">
        <div className="flex items-end gap-2 justify-end">
            <Skeleton className="h-10 w-2/5 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex items-end gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-16 w-3/5 rounded-lg" />
        </div>
      </div>
      <div className="p-4 border-t flex items-center gap-2">
        <Skeleton className="h-10 flex-grow rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </div>
);

const ChatInterface = dynamic(
  () => import('@/components/features/chatbot/ChatInterface').then(mod => mod.ChatInterface),
  { 
    ssr: false,
    loading: () => <ChatInterfaceLoadingSkeleton />,
  }
);


export default function ChatbotPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">KamperHub AI Chatbot</h1>
        <p className="text-muted-foreground font-body mb-6">
          Have questions about caravanning? Our AI assistant is here to help! 
          Ask about maintenance, troubleshooting, destinations, or anything else related to your adventures.
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
