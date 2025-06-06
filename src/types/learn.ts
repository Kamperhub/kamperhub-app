
export interface EducationalVideo {
  id: string;
  title: string;
  description: string;
  videoId: string; // YouTube Video ID
  category: string;
  dataAiHint?: string;
}

export interface AiGeneratedArticle {
  topic: string;
  title: string;
  introduction: string;
  sections: Array<{ heading: string; content: string }>;
  conclusion: string;
}

export const sampleVideos: EducationalVideo[] = [
  {
    id: 'vid1',
    title: 'Arriving at a Campsite for the First Time (and Setting Up)',
    description: 'A comprehensive guide to your first campsite arrival and setup process, ensuring a smooth start to your stay.',
    videoId: 'L_jWHffIx5E', 
    category: 'Setup & Arrival',
    dataAiHint: 'campsite arrival'
  },
  {
    id: 'vid2',
    title: 'Reversing/Parking the Caravan',
    description: 'Master the art of reversing and parking your caravan with these practical tips and techniques for all skill levels.',
    videoId: 'jNQXAC9IVRw', 
    category: 'Driving & Maneuvering',
    dataAiHint: 'caravan reverse'
  },
  {
    id: 'vid3',
    title: 'Understanding Caravan Weights (ATM, GVM, Tow Ball Weight)',
    description: 'Demystifying crucial caravan weights like ATM, GVM, and Tow Ball Weight, and why they are vital for safe towing.',
    videoId: 'M7lc1UVf-VE', 
    category: 'Weights & Safety',
    dataAiHint: 'caravan weights'
  },
  {
    id: 'vid4',
    title: 'Dealing with Flat Tyres or Blowouts',
    description: 'Learn how to safely handle a flat tyre or a sudden blowout on your caravan while on the road.',
    videoId: '_MygxyR0k4', 
    category: 'Maintenance & Troubleshooting',
    dataAiHint: 'flat tyre'
  },
  {
    id: 'vid5',
    title: 'Managing Power (12V, 240V, Solar, Batteries)',
    description: 'A complete guide to your caravan\'s electrical systems, including 12V, 240V, solar power, and battery management.',
    videoId: '09839XhXYps', 
    category: 'On-Road Living',
    dataAiHint: 'caravan power'
  },
  {
    id: 'vid6',
    title: 'Water Management (Filling, Emptying, Conserving)',
    description: 'Everything you need to know about managing water in your caravan: filling tanks, handling grey/black water, and conservation.',
    videoId: 'LXb3EKWsInQ', 
    category: 'On-Road Living',
    dataAiHint: 'water management'
  },
  {
    id: 'vid7',
    title: 'Troubleshooting Appliances (Fridge, Hot Water, Air Con)',
    description: 'Identify common issues and learn troubleshooting tips for essential caravan appliances like fridges, hot water systems, and air conditioners.',
    videoId: 'V_4j922o41k', 
    category: 'Maintenance & Troubleshooting',
    dataAiHint: 'appliance repair'
  },
  {
    id: 'vid8',
    title: 'Emptying the Toilet Cassette / Black Tank',
    description: 'A step-by-step, hygienic guide to emptying and maintaining your caravan\'s toilet cassette or black water tank.',
    videoId: 'Q7HXT3askF8', 
    category: 'On-Road Living',
    dataAiHint: 'toilet cassette'
  },
  {
    id: 'vid9',
    title: 'Navigating Tricky Roads/Tight Spots',
    description: 'Effective techniques for safely navigating narrow roads, tight turns, and other challenging spots with your caravan.',
    videoId: 's04078C2Z5g', 
    category: 'Driving & Maneuvering',
    dataAiHint: 'tricky roads'
  },
  {
    id: 'vid10',
    title: 'Dealing with Unexpected Weather (Wind, Rain, Storms)',
    description: 'How to prepare your caravan and stay safe when encountering unexpected weather conditions like strong winds, heavy rain, or storms.',
    videoId: 'e_SLF0Z2AbQ', 
    category: 'Safety & Preparedness',
    dataAiHint: 'bad weather'
  },
  {
    id: 'vid11',
    title: 'Choosing the Right Campsite (for their experience level)',
    description: 'Valuable tips on selecting campsites that best suit your caravanning experience level and preferences.',
    videoId: 'kY6nqtB0eXI', 
    category: 'Planning & Lifestyle',
    dataAiHint: 'choose campsite'
  },
  {
    id: 'vid12',
    title: 'Basic Maintenance on the Road',
    description: 'A guide to essential caravan maintenance tasks you can (and should) perform while on your travels to keep things running smoothly.',
    videoId: 'LXb3EKWsInQ', 
    category: 'Maintenance & Troubleshooting',
    dataAiHint: 'road maintenance'
  },
  {
    id: 'vid13',
    title: 'Packing and Weight Distribution',
    description: 'Learn how to pack your caravan efficiently and ensure correct weight distribution for optimal safety and towing performance.',
    videoId: 'M7lc1UVf-VE', 
    category: 'Weights & Safety',
    dataAiHint: 'packing caravan'
  },
  {
    id: 'vid14',
    title: 'Roadside Assistance & Breakdowns',
    description: 'What to do in the event of a breakdown, and understanding the roadside assistance options available for caravanners.',
    videoId: '_MygxyR0k4', 
    category: 'Safety & Preparedness',
    dataAiHint: 'roadside assistance'
  },
  {
    id: 'vid15',
    title: 'Caravan Security (Theft & Critters)',
    description: 'Practical tips and measures for keeping your caravan secure from theft and protected from unwanted animal visitors.',
    videoId: '09839XhXYps', 
    category: 'Safety & Preparedness',
    dataAiHint: 'caravan security'
  },
  {
    id: 'vid16',
    title: 'Budgeting & Saving Money on the Road',
    description: 'Smart advice for budgeting your caravan trips effectively and finding ways to save money while enjoying your adventures.',
    videoId: 'L_jWHffIx5E', 
    category: 'Planning & Lifestyle',
    dataAiHint: 'travel budget'
  },
  {
    id: 'vid17',
    title: 'Connecting with Other Caravanners / Building Community',
    description: 'Discover how to meet fellow caravanners, share experiences, and become an active part of the vibrant caravanning community.',
    videoId: 'jNQXAC9IVRw', 
    category: 'Planning & Lifestyle',
    dataAiHint: 'caravan community'
  },
  {
    id: 'vid18',
    title: 'Understanding Road Rules Specific to Caravans',
    description: 'An essential overview of important road rules and regulations that specifically apply when you are towing a caravan.',
    videoId: 's04078C2Z5g', 
    category: 'Driving & Maneuvering',
    dataAiHint: 'caravan rules'
  },
  {
    id: 'vid19',
    title: 'Planning Their First Long Trip / Big Lap',
    description: 'Key planning considerations and steps for successfully embarking on your first extended caravan adventure or the iconic "Big Lap".',
    videoId: 'V_4j922o41k', 
    category: 'Planning & Lifestyle',
    dataAiHint: 'long trip'
  },
  {
    id: 'vid20',
    title: 'Returning Home and Storing the Caravan',
    description: 'Best practices for preparing your caravan for storage after a trip, ensuring it stays in good condition until your next adventure.',
    videoId: 'Q7HXT3askF8', 
    category: 'Maintenance & Troubleshooting',
    dataAiHint: 'storing caravan'
  }
];

const placeholderContent = "Detailed content for this topic will be provided soon. Check back later for helpful tips and advice!";
const placeholderSection = { heading: "Coming Soon", content: placeholderContent };

export const staticCaravanningArticles: AiGeneratedArticle[] = [
  {
    topic: "Arriving at a Campsite for the First Time (and Setting Up)",
    title: "Arriving at a Campsite for the First Time (and Setting Up)",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Reversing/Parking the Caravan",
    title: "Reversing/Parking the Caravan",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Understanding Caravan Weights (ATM, GVM, Tow Ball Weight)",
    title: "Understanding Caravan Weights (ATM, GVM, Tow Ball Weight)",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Dealing with Flat Tyres or Blowouts",
    title: "Dealing with Flat Tyres or Blowouts",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Managing Power (12V, 240V, Solar, Batteries)",
    title: "Managing Power (12V, 240V, Solar, Batteries)",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Water Management (Filling, Emptying, Conserving)",
    title: "Water Management (Filling, Emptying, Conserving)",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Troubleshooting Appliances (Fridge, Hot Water, Air Con)",
    title: "Troubleshooting Appliances (Fridge, Hot Water, Air Con)",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Emptying the Toilet Cassette / Black Tank",
    title: "Emptying the Toilet Cassette / Black Tank",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Navigating Tricky Roads/Tight Spots",
    title: "Navigating Tricky Roads/Tight Spots",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Dealing with Unexpected Weather (Wind, Rain, Storms)",
    title: "Dealing with Unexpected Weather (Wind, Rain, Storms)",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Choosing the Right Campsite (for their experience level)",
    title: "Choosing the Right Campsite (for their experience level)",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Basic Maintenance on the Road",
    title: "Basic Maintenance on the Road",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Packing and Weight Distribution",
    title: "Packing and Weight Distribution",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Roadside Assistance & Breakdowns",
    title: "Roadside Assistance & Breakdowns",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Caravan Security (Theft & Critters)",
    title: "Caravan Security (Theft & Critters)",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Budgeting & Saving Money on the Road",
    title: "Budgeting & Saving Money on the Road",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Connecting with Other Caravanners / Building Community",
    title: "Connecting with Other Caravanners / Building Community",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Understanding Road Rules Specific to Caravans",
    title: "Understanding Road Rules Specific to Caravans",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Planning Their First Long Trip / Big Lap",
    title: "Planning Their First Long Trip / Big Lap",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  },
  {
    topic: "Returning Home and Storing the Caravan",
    title: "Returning Home and Storing the Caravan",
    introduction: placeholderContent,
    sections: [placeholderSection, placeholderSection],
    conclusion: placeholderContent
  }
];
