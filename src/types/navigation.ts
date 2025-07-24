import type { LucideIcon, LucideProps } from 'lucide-react';
import * as icons from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  iconName: keyof typeof icons; // Use icon name string instead of component
  description: string;
  keywords: string;
}

// This is the new central hub for all travel-related pages.
export const tripManagerItems: NavItem[] = [
  {
    href: '/journeys',
    label: 'Journeys',
    iconName: 'Map',
    description: "Group individual trips into epic multi-leg journeys. Plan, track, and map your grand adventures.",
    keywords: 'journey adventure roadtrip'
  },
  {
    href: '/trip-expense-planner',
    label: 'Trip Planner',
    iconName: 'Route',
    description: "Plan routes, set budgets, and track expenses for your individual trips. The building blocks of a Journey.",
    keywords: 'route map budget expense'
  },
  {
    href: '/triplog',
    label: 'Trip Log',
    iconName: 'History',
    description: "Review your past adventures, recall saved trips for re-planning, and see a history of your individual journeys.",
    keywords: 'trip history'
  },
  {
    href: '/trip-packing',
    label: 'Trip Packing Assistant',
    iconName: 'Luggage',
    description: "Use our AI assistant to generate smart, personalized packing lists for your individual trips and passengers.",
    keywords: 'packing checklist luggage'
  },
  {
    href: '/trip-manager/checklists',
    label: 'Procedural Checklists',
    iconName: 'ListChecks',
    description: 'Use pre-departure, setup, and pack-down checklists for your trips. Never miss a step!',
    keywords: 'checklist safety setup',
  },
  {
    href: '/world-map',
    label: 'World Map',
    iconName: 'Globe',
    description: "View all your completed trips and journeys on an interactive global map. Explore your travel history at a glance.",
    keywords: 'world map history travel'
  },
];


// Main navigation items for the dashboard grid. 
export const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    iconName: 'LayoutDashboard',
    description: 'The main hub of your application. Access all features from here.',
    keywords: 'home main overview',
  },
  {
    href: '/dashboard-details',
    label: 'Dashboard Hub',
    iconName: 'Home',
    description: "Access your travel statistics, rewards program, and important document storage all in one place.",
    keywords: 'stats rewards documents'
  },
  {
    href: '/vehicles',
    label: 'Vehicle & Caravan Setup',
    iconName: 'Settings',
    description: "Manage your tow vehicle and caravan specs, including weights, dimensions, and storage. Essential for accurate planning.",
    keywords: 'caravan setup'
  },
  {
    href: '/inventory',
    label: 'Inventory & Weight',
    iconName: 'Backpack',
    description: "Track items, manage weights for storage locations, and monitor compliance with ATM, GTM, and towball limits.",
    keywords: 'camping gear'
  },
  {
    href: '/trip-manager',
    label: 'Trip Manager',
    iconName: 'Briefcase',
    description: 'A central hub to plan individual trips, journeys, packing lists, and review your travel history.',
    keywords: 'trip planner log packing journey map'
  },
  {
    href: '/bookings',
    label: 'Bookings',
    iconName: 'BedDouble',
    description: "Log your campsite and accommodation bookings. Keep track of your stays and find new places to explore.",
    keywords: 'campsite booking'
  },
  {
    href: '/learn',
    label: 'Support & Learn',
    iconName: 'BookOpen',
    description: "Access helpful articles, guides, and the user manual to master your caravanning adventures.",
    keywords: 'support guide manual'
  },
  {
    href: '/contact',
    label: 'Contact Us',
    iconName: 'Mail',
    description: "Get in touch with the KamperHub team for support, feedback, or inquiries.",
    keywords: 'support email help'
  },
  {
    href: '/my-account',
    label: 'My Account',
    iconName: 'UserCircle',
    description: "Update your profile, manage your subscription, and view your account details.",
    keywords: 'profile user'
  },
];

// Specific items for the /dashboard-details page
export const dashboardDetailItems: NavItem[] = [
    {
    href: '/documents',
    label: 'Document Locker',
    iconName: 'FileText',
    description: 'A central, secure place for all your important documents like insurance, registration, and manuals.',
    keywords: 'documents files insurance registration',
  },
  {
    href: '/stats',
    label: 'Travel Statistics',
    iconName: 'BarChart3',
    description: 'Track your kilometers, trips completed, and other interesting travel data.',
    keywords: 'data chart'
  },
  {
    href: '/rewards',
    label: 'Rewards Program',
    iconName: 'Award',
    description: 'Details about loyalty points, badges, and exclusive benefits for KamperHub users.',
    keywords: 'user achievement'
  }
];
