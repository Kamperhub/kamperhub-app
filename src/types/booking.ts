
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
}

export const BOOKINGS_STORAGE_KEY = 'kamperhub_bookings_log';

export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  description?: string;
  dataAiHint?: string; // For placeholder image on affiliate card
}

// Example affiliate links - to be managed by the developer
export const sampleAffiliateLinks: AffiliateLink[] = [
  { 
    id: 'bookingcom', 
    name: 'Booking.com', 
    url: 'https://www.booking.com/index.html?aid=YOUR_AFFILIATE_ID', 
    description: 'Wide range of hotels, homes, and more.',
    dataAiHint: 'hotel travel',
  },
  { 
    id: 'expedia', 
    name: 'Expedia', 
    url: 'https://www.expedia.com/?AID=YOUR_AFFILIATE_ID', 
    description: 'Book flights, hotels, car rentals, and activities.',
    dataAiHint: 'flight booking',
  },
  {
    id: 'agoda',
    name: 'Agoda',
    url: 'https://www.agoda.com/?CID=YOUR_AFFILIATE_ID',
    description: 'Great deals on hotels and accommodations worldwide.',
    dataAiHint: 'accommodation deal',
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    url: 'https://www.airbnb.com/?af=YOUR_AFFILIATE_ID',
    description: 'Unique stays and experiences, from homes to cabins.',
    dataAiHint: 'unique stay',
  },
  {
    id: 'hostelworld',
    name: 'Hostelworld',
    url: 'https://www.hostelworld.com/?source=YOUR_AFFILIATE_SOURCE',
    description: 'Hostels, budget stays, and some campsites.',
    dataAiHint: 'budget travel',
  },
  {
    id: 'wotif',
    name: 'Wotif',
    url: 'https://www.wotif.com/?mc=YOUR_AFFILIATE_CODE',
    description: 'Great deals on hotels, flights, and packages in AU & NZ.',
    dataAiHint: 'australia travel',
  },
  {
    id: 'nswparks',
    name: 'NSW National Parks',
    url: 'https://www.nationalparks.nsw.gov.au/bookings',
    description: 'Book campsites and cabins in New South Wales national parks.',
    dataAiHint: 'nsw park',
  },
  {
    id: 'vicparks',
    name: 'Parks Victoria',
    url: 'https://www.parks.vic.gov.au/bookings',
    description: 'Book campsites and experiences in Victoria\'s parks.',
    dataAiHint: 'vic park',
  },
  {
    id: 'qldparks',
    name: 'QLD National Parks',
    url: 'https://qpws.usedirect.com/QPWS/',
    description: 'Book campsites in Queensland national parks and forests.',
    dataAiHint: 'qld park',
  },
  {
    id: 'waparks',
    name: 'WA National Parks',
    url: 'https://exploreparks.dbca.wa.gov.au/park-stay-wa',
    description: 'Book campsites in Western Australia\'s national parks.',
    dataAiHint: 'wa park',
  },
  {
    id: 'saparks',
    name: 'SA National Parks',
    url: 'https://www.parks.sa.gov.au/booking',
    description: 'Book campsites and accommodation in South Australia\'s parks.',
    dataAiHint: 'sa park',
  },
  {
    id: 'tasparks',
    name: 'Tasmania Parks & Wildlife',
    url: 'https://parks.tas.gov.au/explore-our-parks/know-before-you-go/bookings-and-permits',
    description: 'Bookings and permits for Tasmania\'s national parks.',
    dataAiHint: 'tas park',
  },
  {
    id: 'ntparks',
    name: 'NT Parks and Wildlife',
    url: 'https://parkbookings.nt.gov.au/',
    description: 'Book campsites in Northern Territory parks.',
    dataAiHint: 'nt park',
  },
  {
    id: 'actparks',
    name: 'ACT Parks & Conservation',
    url: 'https://www.parks.act.gov.au/find-a-park',
    description: 'Find parks and booking information for the ACT.',
    dataAiHint: 'act park',
  },
];
