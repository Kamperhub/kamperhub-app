
import type { LucideIcon } from 'lucide-react';
import { Hotel, PlaneTakeoff, Building2, Home, BedSingle, MapPin, Trees, MountainSnow, Leaf, TreePine, Mountain, Tent, BookOpen, Compass, Truck } from 'lucide-react';

export interface BookingEntry {
  id: string;
  siteName: string;
  locationAddress?: string;
  contactPhone?: string;
  contactWebsite?: string;
  confirmationNumber?: string;
  checkInDate: string; // Store as ISO string
  checkOutDate: string; // Store as ISO string
  notes?: string;
  timestamp: string; // ISO string for when the log was created/updated
  assignedTripId?: string | null;
  budgetedCost?: number | null;
}

export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  description?: string;
  dataAiHint?: string; // For placeholder image on affiliate card
  icon?: LucideIcon;
  category: 'Broad Search & Private Land' | 'Government & National Parks' | 'Regional Specialists (AU/NZ)' | 'General Accommodation & Hotels' | 'Guidebooks & Resources';
}

// Example affiliate links - to be managed by the developer
export const sampleAffiliateLinks: AffiliateLink[] = [
  {
    id: 'hipcamp',
    name: 'Hipcamp',
    url: 'https://www.hipcamp.com/',
    description: 'Discover unique camping experiences on private land, farms, and ranches.',
    dataAiHint: 'tent private land',
    icon: Tent,
    category: 'Broad Search & Private Land',
  },
  {
    id: 'campendium',
    name: 'Campendium',
    url: 'https://www.campendium.com/',
    description: 'A comprehensive database with reviews, highly useful for RVers.',
    dataAiHint: 'rv park reviews',
    icon: Truck,
    category: 'Broad Search & Private Land',
  },
  {
    id: 'parksAustralia',
    name: 'Parks Australia (via Hipcamp)',
    url: 'https://www.hipcamp.com/en-AU/discover/australia/national-park-system',
    description: 'Search for campsites in and around Australia\'s National Parks, powered by Hipcamp.',
    dataAiHint: 'australia national park',
    icon: Trees,
    category: 'Government & National Parks',
  },
  {
    id: 'recreationGov',
    name: 'Recreation.gov',
    url: 'https://www.recreation.gov/',
    description: 'Book campsites and activities on federal lands in the United States.',
    dataAiHint: 'usa national park',
    icon: Mountain,
    category: 'Government & National Parks',
  },
  {
    id: 'reserveAmerica',
    name: 'Reserve America',
    url: 'https://www.reserveamerica.com/',
    description: 'Find and book campsites, primarily in US state parks and public lands.',
    dataAiHint: 'state park reservation',
    icon: Leaf,
    category: 'Government & National Parks',
  },
  {
    id: 'qldParks',
    name: 'QLD National Parks',
    url: 'https://qpws.usedirect.com/QPWS/',
    description: 'Book campsites in Queensland\'s stunning national parks and forests.',
    dataAiHint: 'queensland national park',
    icon: Trees,
    category: 'Government & National Parks',
  },
  {
    id: 'wikiCamps',
    name: 'WikiCamps',
    url: 'https://wikicamps.com.au/',
    description: 'A very popular app and database for campsites across Australia.',
    dataAiHint: 'australia map camping',
    icon: MapPin,
    category: 'Regional Specialists (AU/NZ)',
  },
  {
    id: 'camperMate',
    name: 'CamperMate',
    url: 'https://www.campermate.com/',
    description: 'Helpful app for finding campsites, attractions, and facilities in AU & NZ.',
    dataAiHint: 'newzealand map',
    icon: Compass,
    category: 'Regional Specialists (AU/NZ)',
  },
  {
    id: 'bookingcom',
    name: 'Booking.com',
    url: 'https://www.booking.com/',
    description: 'Wide range of hotels, homes, and increasingly, caravan parks.',
    dataAiHint: 'hotel travel',
    icon: Hotel,
    category: 'General Accommodation & Hotels',
  },
   {
    id: 'agoda',
    name: 'Agoda',
    url: 'https://www.agoda.com/',
    description: 'Great deals on hotels and accommodations worldwide.',
    dataAiHint: 'accommodation deal',
    icon: Building2,
    category: 'General Accommodation & Hotels',
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    url: 'https://www.airbnb.com/',
    description: 'Unique stays and experiences, from homes to cabins.',
    dataAiHint: 'unique stay',
    icon: Home,
    category: 'General Accommodation & Hotels',
  },
  {
    id: 'hostelworld',
    name: 'Hostelworld',
    url: 'https://www.hostelworld.com/',
    description: 'Hostels, budget stays, and some campsites.',
    dataAiHint: 'budget travel',
    icon: BedSingle,
    category: 'General Accommodation & Hotels',
  },
   {
    id: 'expedia',
    name: 'Expedia',
    url: 'https://www.expedia.com/',
    description: 'Book flights, hotels, car rentals, and activities.',
    dataAiHint: 'flight booking',
    icon: PlaneTakeoff,
    category: 'General Accommodation & Hotels',
  },
  {
    id: 'campingAroundAustralia',
    name: 'Camping around Australia',
    url: 'https://www.booktopia.com.au/camping-around-australia-exploreaustralia-publishing/book/9781741178499.html',
    description: 'A guidebook listing over 3,000 campsites with details on facilities.',
    dataAiHint: 'book guide',
    icon: BookOpen,
    category: 'Guidebooks & Resources',
  },
  {
    id: 'campsAustraliaWide',
    name: 'Camps Australia Wide',
    url: 'https://www.campsaustraliawide.com/',
    description: "The definitive guide to free and low-cost camping sites across Australia, often called 'The Traveller\'s Bible'.",
    dataAiHint: 'guidebook map australia',
    icon: BookOpen,
    category: 'Guidebooks & Resources',
  }
];
