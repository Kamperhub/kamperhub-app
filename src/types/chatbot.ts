export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  youtubeLink?: string | null; // Allow null
  relatedArticleTitle?: string | null; // Allow null
  timestamp: Date;
}

