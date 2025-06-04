
import type { LucideIcon } from 'lucide-react';
import { Home, CarFront, Backpack, ListChecks, BookOpen, MessageCircle, Route, History, BedDouble } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string; // For AI hint on placeholder images
}

export const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home, keywords: 'dashboard overview' },
  { href: '/vehicles', label: 'Vehicles', icon: CarFront, keywords: 'caravan tow' },
  { href: '/inventory', label: 'Inventory', icon: Backpack, keywords: 'camping gear' },
  { href: '/checklists', label: 'Checklists', icon: ListChecks, keywords: 'travel list' },
  { href: '/tripplanner', label: 'Trip Planner', icon: Route, keywords: 'route plan' },
  { href: '/triplog', label: 'Trip Log', icon: History, keywords: 'trip history' },
  { href: '/bookings', label: 'Bookings', icon: BedDouble, keywords: 'campsite booking' },
  { href: '/learn', label: 'Learn', icon: BookOpen, keywords: 'guide tutorial' },
  { href: '/chatbot', label: 'Chatbot', icon: MessageCircle, keywords: 'support help' },
];
