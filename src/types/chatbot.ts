export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  youtubeLink?: string;
  timestamp: Date;
}
