
import type { LucideIcon } from 'lucide-react';
import { Home, Settings, Backpack, ListChecks, BookOpen, Route, History, BedDouble, CreditCard, BarChart3, Award, UserCircle } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string; // For AI hint on placeholder images
}

// Main navigation items for the dashboard grid and potentially other global navs
export const navItems: NavItem[] = [
  { href: '/dashboard-details', label: 'Dashboard', icon: Home, keywords: 'dashboard overview stats rewards' },
  { href: '/vehicles', label: 'Vehicle & Caravan Setup', icon: Settings, keywords: 'caravan tow setup' },
  { href: '/inventory', label: 'Inventory & Weight', icon: Backpack, keywords: 'camping gear load' },
  { href: '/learn', label: 'Support & Learn', icon: BookOpen, keywords: 'support help guide' },
  { href: '/tripplanner', label: 'Trip Planner', icon: Route, keywords: 'route plan map' },
  { href: '/checklists', label: 'Checklists', icon: ListChecks, keywords: 'travel list preparation' },
  { href: '/triplog', label: 'Trip Log', icon: History, keywords: 'trip history saved' },
  { href: '/bookings', label: 'Bookings', icon: BedDouble, keywords: 'campsite booking accommodation' },
  { href: '/my-account', label: 'My Account', icon: UserCircle, keywords: 'profile settings user' },
  // { href: '/subscribe', label: 'Subscribe', icon: CreditCard, keywords: 'premium membership upgrade' }, // Removed
];

// Specific items for the /dashboard-details page
export const dashboardDetailItems: NavItem[] = [
  { href: '/stats', label: 'Travel Stats', icon: BarChart3, keywords: 'trips summary insights achievement' },
  { href: '/rewards', label: 'Rewards Program', icon: Award, keywords: 'loyalty points badges' },
];
