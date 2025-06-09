
import type { LucideIcon } from 'lucide-react';
import { Home, Settings, Backpack, ListChecks, BookOpen, Route, History, BedDouble, CreditCard, BarChart3 } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string; // For AI hint on placeholder images
}

// New default order for a new user workflow
// "/stats" item removed, as its content is now on "/" (Dashboard)
export const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home, keywords: 'dashboard overview stats' }, // Dashboard now shows stats
  { href: '/vehicles', label: 'Vehicle & Caravan Setup', icon: Settings, keywords: 'caravan tow setup' },
  { href: '/inventory', label: 'Inventory & Weight', icon: Backpack, keywords: 'camping gear load' },
  { href: '/learn', label: 'Support & Learn', icon: BookOpen, keywords: 'support help guide' },
  { href: '/tripplanner', label: 'Trip Planner', icon: Route, keywords: 'route plan map' },
  { href: '/checklists', label: 'Checklists', icon: ListChecks, keywords: 'travel list preparation' },
  { href: '/triplog', label: 'Trip Log', icon: History, keywords: 'trip history saved' },
  // { href: '/stats', label: 'Travel Stats', icon: BarChart3, keywords: 'trips summary insights achievement' }, // This line is removed
  { href: '/bookings', label: 'Bookings', icon: BedDouble, keywords: 'campsite booking accommodation' },
  { href: '/subscribe', label: 'Subscribe', icon: CreditCard, keywords: 'premium membership upgrade' },
];
