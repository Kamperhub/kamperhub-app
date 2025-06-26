
"use client";

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/types/chatbot';
import { caravanSupportChatbot, type CaravanSupportChatbotInput, type CaravanSupportChatbotOutput } from '@/ai/flows/caravan-support-chatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Bot, FileText } from 'lucide-react';
import Link from 'next/link';
import { YouTubeEmbed } from '@/components/features/learn/YouTubeEmbed';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';


export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    if (!user) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to use the chatbot.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const chatbotInput: CaravanSupportChatbotInput = { question: currentInput };
      const response: CaravanSupportChatbotOutput = await caravanSupportChatbot(chatbotInput, user.uid);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.answer,
        youtubeLink: response.youtubeLink,
        relatedArticleTitle: response.relatedArticleTitle,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      let specificMessage = "Sorry, I encountered an error processing your request. Please try again.";
      if (error && typeof error.message === 'string') {
        const errorMessageLower = error.message.toLowerCase();
        if (errorMessageLower.includes("service unavailable") || errorMessageLower.includes("overloaded")) {
          specificMessage = "The AI assistant is currently experiencing high demand or is temporarily unavailable. Please try again in a few moments.";
        } else if (errorMessageLower.includes("api key not valid")) {
          specificMessage = "There seems to be an issue with the AI service configuration. Please try again later.";
        } else if (errorMessageLower.includes("rate_limit_exceeded") || errorMessageLower.includes("quota")){
          specificMessage = "The AI assistant has hit a usage limit for the current period. Please try again later.";
        }
      }
      const errorMessageContent: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: specificMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessageContent]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-350px)] max-h-[500px] bg-card shadow-lg rounded-lg border">
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <Avatar className="h-8 w-8">
                <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
            )}
            <div 
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground' // Changed this line
              }`}
            >
              <p className="text-sm font-body whitespace-pre-wrap">{msg.text}</p>
              {msg.youtubeLink && (
                <div className="mt-3 pt-2 border-t border-muted-foreground/20">
                   <p className="text-xs font-body mb-1">You might find this video helpful:</p>
                   {(() => {
                      try {
                        const url = new URL(msg.youtubeLink!);
                        const videoId = url.searchParams.get('v');
                        if (videoId) {
                           return <div className="mt-1"><YouTubeEmbed videoId={videoId} title="Suggested Video" /></div>;
                        }
                      } catch (e) { /* invalid URL */ }
                      // Fallback to link if embed fails
                      return <Link href={msg.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm font-body">{msg.youtubeLink}</Link>;
                   })()}
                </div>
              )}
              {msg.relatedArticleTitle && (
                <Card className="mt-3 bg-background/50 border-primary/30">
                  <CardHeader className="p-2">
                    <CardTitle className="text-xs font-body font-semibold text-primary flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Related Article:
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    <p className="text-xs font-body text-foreground">
                      "{msg.relatedArticleTitle}"
                    </p>
                    <Link href="/learn" passHref>
                        <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1 text-accent hover:underline">
                            Go to Support Center
                        </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.sender === 'user' && (
              <Avatar className="h-8 w-8">
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback><Bot /></AvatarFallback>
            </Avatar>
            <div className="max-w-[70%] p-3 rounded-lg bg-muted text-muted-foreground">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        )}
      </ScrollArea>
      <div className="p-4 border-t flex items-center gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about caravanning or add an expense..."
          className="flex-grow font-body"
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
          <Send className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
