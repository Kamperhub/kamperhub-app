
import type { LucideIcon } from 'lucide-react';
import { Home, Settings, Backpack, ListChecks, BookOpen, Route, History, BedDouble, CreditCard, BarChart3, Award, UserCircle } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  keywords: string;
}

// Main navigation items for the dashboard grid and potentially other global navs
export const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: Home,
    description: "Your central hub for quick stats, upcoming trips, and personalized insights. Rearrange cards to fit your needs.",
    keywords: 'symbol'
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
    href: '/learn',
    label: 'Support & Learn',
    icon: BookOpen,
    description: "Access helpful articles, video guides, our AI Chatbot, and the user manual to master your caravanning adventures.",
    keywords: 'support guide'
  },
  {
    href: '/tripplanner',
    label: 'Trip Planner',
    icon: Route,
    description: "Plan your routes with detailed maps, estimate travel times, calculate fuel costs, and save your itineraries.",
    keywords: 'route map'
  },
  {
    href: '/checklists',
    label: 'Checklists',
    icon: ListChecks,
    description: "Create pre-departure, setup, and pack-down checklists for trips and caravan defaults. Never miss a step!",
    keywords: 'travel list'
  },
  {
    href: '/triplog',
    label: 'Trip Log',
    icon: History,
    description: "Review your past adventures, recall saved trips for re-planning, and keep a history of your journeys.",
    keywords: 'trip history'
  },
  {
    href: '/bookings',
    label: 'Bookings',
    icon: BedDouble,
    description: "Log your campsite and accommodation bookings. Keep track of your stays and find new places to explore.",
    keywords: 'campsite booking'
  },
  {
    href: '/my-account',
    label: 'My Account',
    icon: UserCircle,
    description: "Update your profile, manage your subscription, and view your account details.",
    keywords: 'profile user'
  },
];

// Specific items for the /dashboard-details page
export const dashboardDetailItems: NavItem[] = [
  {
    href: '/stats',
    label: 'Travel Stats',
    icon: BarChart3,
    description: "View your accumulated travel statistics, trip history insights, and milestones achieved on your journeys.",
    keywords: 'data chart'
  },
  {
    href: '/rewards',
    label: 'Rewards Program',
    icon: Award,
    description: "Discover how you can earn rewards, badges, and benefits with KamperHub as you explore.",
    keywords: 'user achievement'
  },
];

