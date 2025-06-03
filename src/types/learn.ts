export interface EducationalVideo {
  id: string;
  title: string;
  description: string;
  videoId: string; // YouTube Video ID
  category: string;
  dataAiHint?: string;
}

export const sampleVideos: EducationalVideo[] = [
  {
    id: 'vid1',
    title: 'Caravan Towing Basics for Beginners',
    description: 'Learn the fundamental skills and safety checks for towing a caravan.',
    videoId: 'dQw4w9WgXcQ', // Placeholder, replace with actual relevant video ID
    category: 'Towing',
    dataAiHint: 'caravan towing'
  },
  {
    id: 'vid2',
    title: 'Setting Up Your Campsite Like a Pro',
    description: 'A step-by-step guide to efficiently setting up your caravan at a campsite.',
    videoId: 'oHg5SJYRHA0', // Placeholder
    category: 'Campsite Setup',
    dataAiHint: 'campsite setup'
  },
  {
    id: 'vid3',
    title: 'Understanding Caravan Weights',
    description: 'Crucial information about caravan weights, limits, and safe loading.',
    videoId: 'Y_d_mYg124k', // Placeholder
    category: 'Weight Management',
    dataAiHint: 'caravan weight'
  },
  {
    id: 'vid4',
    title: 'Essential Caravan Maintenance Tips',
    description: 'Keep your caravan in top shape with these regular maintenance checks.',
    videoId: 'QH2-TGUlwu4', // Placeholder
    category: 'Maintenance',
    dataAiHint: 'caravan maintenance'
  },
];
