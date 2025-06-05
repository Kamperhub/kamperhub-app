
"use client";

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/types/chatbot';
import { caravanSupportChatbot, type CaravanSupportChatbotInput } from '@/ai/flows/caravan-support-chatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User, Bot } from 'lucide-react';
import Link from 'next/link';
import { YouTubeEmbed } from '@/components/features/learn/YouTubeEmbed';
import { Skeleton } from '@/components/ui/skeleton';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatbotInput: CaravanSupportChatbotInput = { question: input };
      const response = await caravanSupportChatbot(chatbotInput);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.answer,
        youtubeLink: response.youtubeLink,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      let specificMessage = "Sorry, I encountered an error processing your request. Please try again.";
      if (error && typeof error.message === 'string') {
        if (error.message.toLowerCase().includes("service unavailable") || error.message.toLowerCase().includes("overloaded")) {
          specificMessage = "The AI assistant is currently experiencing high demand or is temporarily unavailable. Please try again in a few moments.";
        } else if (error.message.toLowerCase().includes("api key not valid")) {
          // This message is more for the developer if the API key is wrong.
          specificMessage = "There seems to be an issue with the AI service configuration. Please try again later.";
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
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px] bg-card shadow-lg rounded-lg border">
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
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <p className="text-sm font-body whitespace-pre-wrap">{msg.text}</p>
              {msg.youtubeLink && (
                <div className="mt-2">
                   <p className="text-xs font-body mb-1">You might find this video helpful:</p>
                   <Link href={msg.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm font-body">
                     {msg.youtubeLink}
                   </Link>
                   {/* Basic YouTube ID extraction for embed */}
                   {(() => {
                      try {
                        const url = new URL(msg.youtubeLink!);
                        const videoId = url.searchParams.get('v');
                        if (videoId) {
                           return <div className="mt-2"><YouTubeEmbed videoId={videoId} title="Suggested Video" /></div>;
                        }
                      } catch (e) { /* invalid URL */ }
                      return null;
                   })()}
                </div>
              )}
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-secondary-foreground/70'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
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
            <div className="max-w-[70%] p-3 rounded-lg bg-secondary text-secondary-foreground">
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
          placeholder="Ask about caravanning..."
          className="flex-grow font-body"
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
          <Send className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
