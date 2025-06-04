
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
  }
];
