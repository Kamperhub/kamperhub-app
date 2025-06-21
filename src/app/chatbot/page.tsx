
import { ChatInterface } from '@/components/features/chatbot/ChatInterface';

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
