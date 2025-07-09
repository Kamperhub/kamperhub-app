
import type { LucideIcon } from 'lucide-react';
import { Home, Settings, Backpack, ListChecks, BookOpen, Route as RouteIcon, History, BedDouble, UserCircle, BarChart3, Award, LayoutDashboard, BookText, Mail, MessageSquare, Luggage, Briefcase, Map, Globe } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  keywords: string;
}

// This is the new central hub for all travel-related pages.
// THIS IS THE CORRECT, STATIC DEFINITION.
export const tripManagerItems: NavItem[] = [
  {
    href: '/journeys',
    label: 'Journeys',
    icon: Map,
    description: "Group individual trips into epic multi-leg journeys. Plan, track, and map your grand adventures.",
    keywords: 'journey adventure roadtrip'
  },
  {
    href: '/world-map',
    label: 'World Map',
    icon: Globe,
    description: "View all your completed trips and journeys on an interactive global map. Explore your travel history at a glance.",
    keywords: 'world map history travel'
  },
  {
    href: '/trip-expense-planner',
    label: 'Trip Planner',
    icon: RouteIcon,
    description: "Plan routes, set budgets, and track expenses for your individual trips. The building blocks of a Journey.",
    keywords: 'route map budget expense'
  },
  {
    href: '/triplog',
    label: 'Trip Log',
    icon: History,
    description: "Review your past adventures, recall saved trips for re-planning, and see a history of your individual journeys.",
    keywords: 'trip history'
  },
  {
    href: '/trip-packing',
    label: 'Trip Packing Assistant',
    icon: Luggage,
    description: "Use our AI assistant to generate smart, personalized packing lists for your individual trips and passengers.",
    keywords: 'packing checklist luggage'
  },
];


// Main navigation items for the dashboard grid. 
// THIS IS THE CORRECT, CONSOLIDATED LIST. "Journeys" and "World Map" have been correctly removed.
export const navItems: NavItem[] = [
  {
    href: '/dashboard-details',
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: "Access your travel statistics, rewards program, and other detailed dashboard views.",
    keywords: 'statistics rewards'
  },
  {
    href: '/vehicles',
    label: 'Vehicle & Caravan Setup',
    icon: Settings,
    description: "Manage your tow vehicle and caravan specs, including weights, dimensions, and storage. Essential for accurate planning.",
    keywords: 'caravan setup'
  },
  {
    href: '/inventory',
    label: 'Inventory & Weight',
    icon: Backpack,
    description: "Track items, manage weights for storage locations, and monitor compliance with ATM, GTM, and towball limits.",
    keywords: 'camping gear'
  },
  {
    href: '/trip-manager',
    label: 'Trip Manager',
    icon: Briefcase,
    description: 'A central hub to plan individual trips, journeys, packing lists, and review your travel history.',
    keywords: 'trip planner log packing journey map'
  },
  {
    href: '/checklists',
    label: 'Checklists',
    icon: ListChecks,
    description: "Create pre-departure, setup, and pack-down checklists for trips and caravan defaults. Never miss a step!",
    keywords: 'travel list'
  },
  {
    href: '/bookings',
    label: 'Bookings',
    icon: BedDouble,
    description: "Log your campsite and accommodation bookings. Keep track of your stays and find new places to explore.",
    keywords: 'campsite booking'
  },
  {
    href: '/learn',
    label: 'Support & Learn',
    icon: BookOpen,
    description: "Access helpful articles, video guides, and the user manual to master your caravanning adventures.",
    keywords: 'support guide manual'
  },
  {
    href: '/contact',
    label: 'Contact Us',
    icon: Mail,
    description: "Get in touch with the KamperHub team for support, feedback, or inquiries.",
    keywords: 'support email help'
  },
  {
    href: '/my-account',
    label: 'My Account',
    icon: UserCircle,
    description: "Update your profile, manage your subscription, and view your account details.",
    keywords: 'profile user'
  },
];

// Specific items for the /dashboard-details page (this remains the same)
export const dashboardDetailItems: NavItem[] = [
  {
    href: '/stats',
    label: 'Travel Statistics',
    icon: BarChart3,
    description: 'Track your kilometers, trips completed, and other interesting travel data.',
    keywords: 'data chart'
  },
  {
    href: '/rewards',
    label: 'Rewards Program',
    icon: Award,
    description: 'Details about loyalty points, badges, and exclusive benefits for KamperHub users.',
    keywords: 'user achievement'
  }
];
