
import type { LucideIcon } from 'lucide-react';
import { Home, CarFront, Backpack, ListChecks, BookOpen, Route, History, BedDouble, CreditCard, Settings } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string; // For AI hint on placeholder images
}

// New default order for a new user workflow
export const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home, keywords: 'dashboard overview' },
  { href: '/vehicles', label: 'Vehicle & Caravan Setup', icon: Settings, keywords: 'caravan tow setup' }, // Changed label & icon for clarity
  { href: '/inventory', label: 'Inventory & Weight', icon: Backpack, keywords: 'camping gear load' }, // Shortened label
  { href: '/learn', label: 'Support & Learn', icon: BookOpen, keywords: 'support help guide' }, // Moved up
  { href: '/tripplanner', label: 'Trip Planner', icon: Route, keywords: 'route plan map' },
  { href: '/checklists', label: 'Checklists', icon: ListChecks, keywords: 'travel list preparation' },
  { href: '/triplog', label: 'Trip Log', icon: History, keywords: 'trip history saved' },
  { href: '/bookings', label: 'Bookings', icon: BedDouble, keywords: 'campsite booking accommodation' },
  { href: '/subscribe', label: 'Subscribe', icon: CreditCard, keywords: 'premium membership upgrade' },
];
