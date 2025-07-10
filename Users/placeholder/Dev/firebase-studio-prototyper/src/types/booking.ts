
import type { LucideIcon } from 'lucide-react';
import { Hotel, PlaneTakeoff, Building2, Home, BedSingle, MapPin, Trees, MountainSnow, Leaf, TreePine, Mountain, Tent, BookOpen, Compass, Truck } from 'lucide-react';

export interface BookingEntry {
  id: string;
  siteName: string;
  locationAddress?: string;
  contactPhone?: string;
  contactWebsite?: string;
  confirmationNumber?: string;
  checkInDate: string; // Store as ISO string or YYYY-MM-DD
  checkOutDate: string; // Store as ISO string or YYYY-MM-DD
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
  },
  {
    id: 'campendium',
    name: 'Campendium',
    url: 'https://www.campendium.com/',
    description: 'A comprehensive database with reviews, highly useful for RVers.',
    dataAiHint: 'rv park reviews',
    icon: Truck,
  },
  {
    id: 'recreationGov',
    name: 'Recreation.gov',
    url: 'https://www.recreation.gov/',
    description: 'Book campsites and activities on federal lands in the United States.',
    dataAiHint: 'usa national park',
    icon: Mountain,
  },
  {
    id: 'parksAustralia',
    name: 'Parks Australia',
    url: 'https://parksaustralia.gov.au/kakadu/plan/camping/',
    description: 'Information and booking for campgrounds in Australia\'s Commonwealth National Parks.',
    dataAiHint: 'australia national park',
    icon: Trees,
  },
  {
    id: 'wikiCamps',
    name: 'WikiCamps',
    url: 'https://wikicamps.com.au/',
    description: 'A very popular app and database for campsites across Australia.',
    dataAiHint: 'australia map camping',
    icon: MapPin,
  },
  {
    id: 'reserveAmerica',
    name: 'Reserve America',
    url: 'https://www.reserveamerica.com/',
    description: 'Find and book campsites, primarily in US state parks and public lands.',
    dataAiHint: 'state park reservation',
    icon: Leaf,
  },
  {
    id: 'camperMate',
    name: 'CamperMate',
    url: 'https://www.campermate.com/',
    description: 'Helpful app for finding campsites, attractions, and facilities in AU & NZ.',
    dataAiHint: 'newzealand map',
    icon: Compass,
  },
  {
    id: 'bookingcom',
    name: 'Booking.com',
    url: 'https://www.booking.com/index.html?aid=YOUR_AFFILIATE_ID',
    description: 'Wide range of hotels, homes, and increasingly, caravan parks.',
    dataAiHint: 'hotel travel',
    icon: Hotel,
  },
  {
    id: 'campingAroundAustralia',
    name: 'Camping around Australia',
    url: 'https://www.booktopia.com.au/camping-around-australia-exploreaustralia-publishing/book/9781741178499.html',
    description: 'A guidebook listing over 3,000 campsites with details on facilities.',
    dataAiHint: 'book guide',
    icon: BookOpen,
  },
   {
    id: 'agoda',
    name: 'Agoda',
    url: 'https://www.agoda.com/?CID=YOUR_AFFILIATE_ID',
    description: 'Great deals on hotels and accommodations worldwide.',
    dataAiHint: 'accommodation deal',
    icon: Building2,
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    url: 'https://www.airbnb.com/?af=YOUR_AFFILIATE_ID',
    description: 'Unique stays and experiences, from homes to cabins.',
    dataAiHint: 'unique stay',
    icon: Home,
  },
  {
    id: 'hostelworld',
    name: 'Hostelworld',
    url: 'https://www.hostelworld.com/?source=YOUR_AFFILIATE_SOURCE',
    description: 'Hostels, budget stays, and some campsites.',
    dataAiHint: 'budget travel',
    icon: BedSingle,
  },
   {
    id: 'expedia',
    name: 'Expedia',
    url: 'https://www.expedia.com/?AID=YOUR_AFFILIATE_ID',
    description: 'Book flights, hotels, car rentals, and activities.',
    dataAiHint: 'flight booking',
    icon: PlaneTakeoff,
  },
];
