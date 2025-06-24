
import type { LucideIcon } from 'lucide-react';
import { Hotel, PlaneTakeoff, Building2, Home, BedSingle, MapPin, Trees, MountainSnow, Leaf, TreePine, Mountain, Tent } from 'lucide-react';

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
    id: 'bookingcom',
    name: 'Booking.com',
    url: 'https://www.booking.com/index.html?aid=YOUR_AFFILIATE_ID',
    description: 'Wide range of hotels, homes, and more.',
    dataAiHint: 'hotel travel',
    icon: Hotel,
  },
  {
    id: 'expedia',
    name: 'Expedia',
    url: 'https://www.expedia.com/?AID=YOUR_AFFILIATE_ID',
    description: 'Book flights, hotels, car rentals, and activities.',
    dataAiHint: 'flight booking',
    icon: PlaneTakeoff,
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
    id: 'wotif',
    name: 'Wotif',
    url: 'https://www.wotif.com/?mc=YOUR_AFFILIATE_CODE',
    description: 'Great deals on hotels, flights, and packages in AU & NZ.',
    dataAiHint: 'australia travel',
    icon: MapPin,
  },
  {
    id: 'australiaParks',
    name: 'Australia National Parks',
    url: 'https://parksaustralia.gov.au/',
    description: "Explore and book campsites in Australia's national parks.",
    dataAiHint: 'australia park',
    icon: Trees,
  },
  {
    id: 'nzParks',
    name: 'New Zealand National Parks',
    url: 'https://www.newzealand.com/au/national-parks/',
    description: "Discover and plan visits to New Zealand's stunning national parks.",
    dataAiHint: 'newzealand nature',
    icon: MountainSnow,
  },
  {
    id: 'europeParks',
    name: 'European National Parks',
    url: 'https://national-parks.org/europe',
    description: "Discover national parks across Europe.",
    dataAiHint: 'europe nature',
    icon: Leaf,
  },
  {
    id: 'ukParks',
    name: 'UK National Parks',
    url: 'https://www.cnp.org.uk/our-national-parks/why-we-campaign/access/wild-camping/',
    description: "Information on national parks and wild camping in the UK.",
    dataAiHint: 'uk camping',
    icon: TreePine,
  },
  {
    id: 'usaParks',
    name: 'USA National Parks',
    url: 'https://www.nps.gov/findapark/index.htm',
    description: "Find and explore national parks in the United States.",
    dataAiHint: 'usa nature',
    icon: Mountain,
  },
  {
    id: 'asiaWildCamping',
    name: 'Asia Wild Camping',
    url: 'https://www.caravanya.com/en/wildcamping-in-asia/',
    description: "Guide to wild camping spots across Asia.",
    dataAiHint: 'asia adventure',
    icon: Tent,
  },
];
