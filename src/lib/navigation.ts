
import type { LucideIcon } from 'lucide-react';
import { Home, CarFront, Backpack, ListChecks, BookOpen, Route, History, BedDouble, CreditCard } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string; // For AI hint on placeholder images
}

export const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home, keywords: 'dashboard overview' },
  { href: '/vehicles', label: 'Vehicle, Caravan , Storage & WDH Data', icon: CarFront, keywords: 'caravan tow' },
  { href: '/inventory', label: 'Inventory & Weight Management', icon: Backpack, keywords: 'camping gear' },
  { href: '/checklists', label: 'Checklists', icon: ListChecks, keywords: 'travel list' },
  { href: '/tripplanner', label: 'Trip Planner', icon: Route, keywords: 'route plan' },
  { href: '/triplog', label: 'Trip Log', icon: History, keywords: 'trip history' },
  { href: '/bookings', label: 'Bookings', icon: BedDouble, keywords: 'campsite booking' },
  { href: '/learn', label: 'Support', icon: BookOpen, keywords: 'support help guide' },
  { href: '/subscribe', label: 'Subscribe', icon: CreditCard, keywords: 'premium membership' },
];

