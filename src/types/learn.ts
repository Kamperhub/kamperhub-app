
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
    introduction: "The moment you pull into your first caravan park site is a mix of pure excitement and a flutter of apprehension. You've dreamed of this moment, but now that you're here, with your caravan stretching out behind you, a million questions might pop up: Where do I park? What do I do first? How do I even get this thing level? It can feel overwhelming, like there's a secret handshake you haven't learned yet.\nDon't fret! Every experienced caravanner was once a beginner. This comprehensive guide will break down the entire arrival and setup process into simple, manageable steps, transforming potential stress into a smooth, confident experience. Think of it as your personal blueprint for a hassle-free start to every trip. And to make it even easier, Kamperhub can be your digital checklist and trusted co-pilot every step of the way.",
    sections: [
      {
        heading: "Pre-Arrival Preparations",
        content: "Before you even turn into the park's driveway, a little preparation goes a long way. This forethought can save you time and frustration later on.\nFirst and foremost, double-check your booking confirmation. Do you have the correct site number? Are there any specific park rules you need to be aware of, like height restrictions for your caravan, designated quiet hours, or special rules for pets? Knowing these in advance prevents surprises. It's also wise to mentally run through the initial steps of arrival and setup. Visualize yourself pulling in, parking, and connecting. This mental rehearsal can significantly reduce on-the-spot panic.\nKamperhub Integration: Use Kamperhub’s 'Bookings' feature to store your booking information, site number, and easily access park amenities and rules. This keeps all your crucial information in one accessible place."
      },
      {
        heading: "The Approach: Reconnaissance is Key",
        content: "This is perhaps the most critical tip for new caravanners: don't just drive straight onto your site! If possible and safe, park your rig temporarily nearby (e.g., in a visitor parking bay or at the entrance) and do a quick walk-around of your assigned site.\nDuring this reconnaissance mission, you're looking for a few key things:\nIdentify Utilities: Locate the power pole, water tap, and any grey water drains relative to your proposed parking spot. Where are they in relation to your caravan's connection points? This helps you determine the best orientation for your van.\nNote Obstacles: Look for overhanging tree branches, low-hanging wires, bollards, fire pits, or rocks that could obstruct your reversing path or awning extension.\nAssess Ground Conditions: Is the ground perfectly level, or is there a noticeable slope? Where are the soft spots? This will inform your levelling strategy.\nPlan Your Manoeuvre: Visualize your reversing or parking path. Which way do you need to turn? Are there any tight spots? Having a clear plan before you start reversing makes the process much smoother.\nKamperhub Integration: You can use Kamperhub’s notes feature to jot down site-specific observations or even take photos of obstacles or utility points for future reference. This builds a valuable personal database for campsites you revisit."
      },
      {
        heading: "Positioning Your Caravan",
        content: "Now it's time to get your caravan onto the site. This is where many novices feel the most pressure, but remember: slow and steady wins the race.\nThe Art of Reversing:\nSlow & Steady: Go excruciatingly slow. A snail's pace is your friend.\nSmall Corrections: Make tiny adjustments to your steering wheel. Over-correcting is the most common mistake and will send your van wildly off course.\nUse a Spotter: This is non-negotiable for new caravanners, and highly recommended for everyone. Your spotter should stand where you can see them clearly (in your mirrors or directly if safe) and use clear hand signals (or a two-way radio). Agree on signals beforehand!\nPractice Makes Perfect: Don't be afraid to pull forward and start again if you're not getting it right. Everyone does it.\nAim for Level Ground: While you'll level properly later, try to position your caravan as level as possible side-to-side initially. This minimises the effort needed for levelling ramps.\nConsider Awning Placement: Think about where your awning will extend. Will it be in direct sun all day? Will it impede your neighbours or other site features?\nChocking Your Wheels: Once the caravan is roughly in position, and before you unhitch, place wheel chocks firmly under the caravan's wheels (on both sides, if possible, and on the downhill side if on a slope). This prevents any movement while you unhitch and level.\nKamperhub Integration: While Kamperhub might not offer a direct reversing guide, it can serve as a simple visual level reminder. You might even find user-submitted photos or tips in Kamperhub for specific sites, showing the best way to approach or level."
      },
      {
        heading: "Unhitching and Levelling",
        content: "With your caravan chocked, it's time to disconnect from your tow vehicle and achieve that perfect level.\nUnhitching Sequence:\nEnsure wheel chocks are in place and the caravan's handbrake is engaged.\nLower the jockey wheel until it takes some of the weight off the hitch.\nDisconnect the safety chains from your tow vehicle.\nDisconnect the electrical power lead (e.g., 7-pin or 12-pin plug) from your car.\nOnce the hitch is ready (either by releasing the lever or winding the jockey wheel slightly higher), release the hitch coupling from the tow ball.\nWind the jockey wheel a little more to lift the caravan clear of the tow ball, then slowly drive your tow vehicle forward a short distance.\nLevelling the Caravan: This is crucial for comfort, proper fridge operation, and drainage.\nSide-to-Side Levelling First: This is done by driving one side of the caravan up onto levelling ramps or blocks before unhitching (which is why reconnaissance is so important!). Use a spirit level (a physical one or a level app on your phone) placed on the caravan floor or benchtop. Once level side-to-side, ensure wheel chocks are firmly in place.\nFront-to-Back Levelling: Use the jockey wheel to raise or lower the front of the caravan until it's level front-to-back. Again, use your spirit level.\nWhy Levelling Matters: An unlevel caravan can cause your fridge to not cool effectively (especially absorption fridges on gas), uncomfortable sleeping, inefficient drainage in sinks and showers, and even doors swinging open or closed on their own.\nKamperhub Integration: This is where Kamperhub's 'Setup Checklist' comes into its own. It can guide you step-by-step through the unhitching and levelling process, ensuring you don't miss any critical safety or operational steps."
      },
      {
        heading: "Stabilising Your Caravan",
        content: "Once your caravan is level, the next step is to make it rock-solid. This is where your stabiliser legs come in.\nUnderstanding Stabiliser Legs: These legs are not for lifting the caravan or taking its weight. Their sole purpose is to provide stability and take out the wobble once the caravan is level and supported by its wheels (and jockey wheel). Using them for lifting can damage your chassis.\nWinding Them Down: Start by winding down the rear stabiliser legs first, until they are firmly touching the ground and just begin to take out the bounce. Don't overtighten them. Then, do the same for the front stabiliser legs. The goal is to make the caravan feel stable, not to lift it off its wheels. Many caravanners use small pads or blocks under the feet of the stabiliser legs to prevent them from sinking into soft ground.\nKamperhub Integration: Another clear tick on your Kamperhub setup checklist, reminding you to wind down the stabiliser legs."
      },
      {
        heading: "Connecting Utilities",
        content: "With your caravan securely in place, it’s time to hook up to the park’s services.\nPower:\nSafety First! Always plug the power lead into your caravan first, ensuring the caravan's main circuit breaker is off.\nThen, plug the other end into the power pole.\nSwitch on the power at the pole.\nGo inside your caravan and switch on your main circuit breaker (RCD). Check that your 240V appliances (e.g., air conditioner, microwave) are now receiving power.\nWater: Connect your dedicated fresh water hose (food-grade hose only!) to the park's tap and then to your caravan's fresh water inlet. If you're on a non-drinking water supply, use a filter.\nGrey Water: You'll need to manage your grey water (from sinks and showers). Options include:\nA large bucket placed under the outlet (emptied regularly).\nA portable grey water tank.\nConnecting a grey water hose to a designated drain point on your site (if available and permitted by the park).\nKamperhub Integration: Kamperhub can feature clear reminders for connecting each utility in the correct sequence, ensuring safety and efficiency."
      }
    ],
    conclusion: "Congratulations! You've successfully navigated your first caravan park arrival and setup. The awning's out, the fridge is cold, and you're ready to relax. While the first time might feel like a complex dance, remember: it gets incredibly easier and faster with practice. Soon, you'll be setting up your campsite like a seasoned pro, leaving more time for relaxation and adventure.\nDownload Kamperhub today for all your caravanning checklists, guides, and practical tips – making every arrival a stress-free start to your next amazing journey!"
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
