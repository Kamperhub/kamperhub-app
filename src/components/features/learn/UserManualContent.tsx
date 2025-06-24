
// src/components/features/learn/UserManualContent.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, Settings2, Backpack, ListChecks, Route as RouteIcon, History, BedDouble, BookOpen, ShieldAlert, UserCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export function UserManualContent() {
  const importantNoteContent = (
    <>
      <p>
        KamperHub securely saves your application data to your user account on the server using Firebase Firestore. This includes your:
      </p>
      <ul className="list-disc pl-5 my-2 space-y-1">
        <li>Vehicle, Caravan, and WDH details</li>
        <li>Inventory items and water tank levels</li>
        <li>Trip plans and logged trips</li>
        <li>Checklists (both trip-specific and caravan defaults)</li>
        <li>Accommodation bookings</li>
        <li>Customized dashboard layout</li>
      </ul>
      <p>
        This server-side storage means:
      </p>
      <ul className="list-disc pl-5 my-2 space-y-1">
        <li><strong>Your data is safe and backed up.</strong> It won't be lost if you clear your browser's cache or use a different computer.</li>
        <li><strong>Your data is synced across devices.</strong> You can log in on your phone or laptop and access the same information.</li>
      </ul>
    </>
  );

  const manualSections = [
    {
      title: "1. Dashboard",
      icon: LayoutDashboard,
      content: (
        <>
          <p>The Dashboard is your home screen, providing quick access to all of KamperHub's features. Each card represents a core section of the app. You can drag and drop these cards to customize the layout to your preference (on desktop). This layout is saved to your account and will sync across devices.</p>
        </>
      )
    },
    {
      title: "Important Note on Data Storage",
      icon: ShieldAlert,
      isAlertSection: true,
      content: importantNoteContent
    },
    {
      title: "2. Vehicle, Caravan, Storage & WDH Data (/vehicles)",
      icon: Settings2,
      content: (
        <>
          <p>This section is crucial for setting up the foundational data for your rig. Accurate information here powers features like the Trip Planner and Inventory & Weight Management.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <h4 className="font-semibold font-headline text-md text-foreground">Tow Vehicles:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Add/Edit:</strong> Record details like make, model, year, GVM (Gross Vehicle Mass), GCM (Gross Combined Mass), max towing capacity, max towball mass, fuel efficiency, kerb weight, axle limits, and wheelbase.</li>
                <li><strong>Storage Locations:</strong> Define specific storage areas within your tow vehicle (e.g., "Boot," "Roof Box"), specifying their position relative to axles/centerline and optional weight capacities. This helps with detailed weight distribution in the Inventory section.</li>
                <li><strong>Set Active:</strong> You can mark one tow vehicle as "Active." This active vehicle's specifications (especially fuel efficiency) will be used by default in the Trip Planner and Inventory calculations.</li>
              </ul>
            </li>
            <li>
              <h4 className="font-semibold font-headline text-md text-foreground">Caravans:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Add/Edit:</strong> Input details like make, model, year, Tare Mass, ATM (Aggregate Trailer Mass), GTM (Gross Trailer Mass), max towball download, number of axles, and various dimensions (overall length, body length, height, hitch-to-axle distance, inter-axle spacing).</li>
                <li><strong>Storage Locations:</strong> Similar to vehicles, define specific storage areas within your caravan (e.g., "Front Boot," "Under Bed Storage"), their positions, and optional weight capacities for precise inventory management.</li>
                <li><strong>Water Tanks:</strong> Add details for each water tank (fresh, grey, black), including its name, capacity (in Liters), and position within the caravan. This is used in the Inventory section to calculate water weight.</li>
                <li><strong>Associate WDH:</strong> Link a saved Weight Distribution Hitch (WDH) to the caravan.</li>
                <li><strong>Set Active:</strong> Mark one caravan as "Active." The active caravan's specifications are used in the Inventory & Weight Management page and for generating default checklists for new trips.</li>
              </ul>
            </li>
            <li>
              <h4 className="font-semibold font-headline text-md text-foreground">Weight Distribution Hitches (WDHs):</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Add/Edit:</strong> Store information about your WDHs, including name/model, type (e.g., Round Bar, Trunnion), maximum and optional minimum towball capacity, and whether it has integrated sway control (or details of separate sway control).</li>
                <li><strong>Set Active:</strong> You can set one WDH as "Active." This is mainly for reference in the Inventory & Weight Management section. If a caravan with an associated WDH is made active, its WDH will also become active.</li>
              </ul>
            </li>
          </ul>
          <p className="text-sm"><strong>Subscription Note:</strong> The free version of KamperHub allows you to add 1 tow vehicle, 1 caravan, and 1 WDH. Upgrade to Pro for unlimited entries.</p>
        </>
      )
    },
    {
      title: "3. Inventory & Weight Management (/inventory)",
      icon: Backpack,
      content: (
         <>
          <p>This powerful tool helps you track items loaded into your active caravan and vehicle, manage their weights, and monitor compliance with various weight limits (ATM, GTM, Towball Mass, GVM, GCM).</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Active Selections:</strong> This page relies heavily on the "Active" caravan, "Active" tow vehicle, and "Active" WDH set in the <code>/vehicles</code> section. Ensure these are correctly selected for accurate calculations and relevant storage locations.</li>
            <li><strong>Adding Items:</strong> Input item name, weight (per item), quantity, and assign it to a predefined storage location (from your active caravan or vehicle's setup). Item weights contribute to the caravan's load.</li>
            <li><strong>Water Tank Levels:</strong> Adjust the fill percentage for each water tank defined for your active caravan. The weight of the water (1kg per liter) is automatically calculated and added to your caravan's total mass and impacts towball mass estimates.</li>
            <li><strong>Weight Summary & Compliance:</strong>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Visual Charts:</strong> Donut charts provide a quick visual overview of your Caravan ATM, GTM, and estimated Towball Mass against their respective limits.</li>
                    <li><strong>Detailed Alerts & Status:</strong> The system provides alerts for Caravan Compliance (ATM, GTM, Towball), Tow Vehicle Compliance (Max Tow Capacity, Vehicle Max Towball, GCM advisory), and WDH Compatibility (Max/Min operating range). Storage location load statuses are also displayed if capacities are defined.</li>
                </ul>
            </li>
            <li><strong>Weighbridge Notice:</strong> Always verify your actual weights at a certified weighbridge. KamperHub provides estimates based on your input, and towball mass is estimated as 10% of combined inventory and water payload by default (future enhancements could refine this based on item placement).</li>
        </ul>
        </>
      )
    },
    {
      title: "4. Checklists (/checklists)",
      icon: ListChecks,
      content: (
        <>
          <p>KamperHub offers a flexible checklist system to ensure you don't miss crucial steps for different phases of your journey. All checklist data is saved to your account and available across devices.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Two Types of Checklists:</strong>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong>Caravan Default Checklists:</strong> You can define a default set of checklists (Pre-Departure, Campsite Setup, Pack-Down) for each of your caravans. These are managed under the "Manage Caravan Defaults" tab. This template will be used for new trips planned with that specific caravan.</li>
                <li><strong>Trip-Specific Checklists:</strong> When you save a trip from the Trip Planner, a unique checklist set is automatically created for it. This checklist is copied from the active caravan's default (if one is set and the caravan is active during trip planning) or from a global template if no caravan default exists. Modifications here only affect this specific trip. These are managed under the "Manage Trip Checklists" tab.</li>
              </ol>
            </li>
            <li><strong>Using Checklists:</strong> You can add, delete, reorder, and mark items as completed. The completion status is saved for each specific trip's checklist or caravan default.</li>
          </ul>
        </>
      )
    },
    {
      title: "5. Trip Planner (/tripplanner)",
      icon: RouteIcon,
      content: (
        <>
          <p>Plan your routes, estimate travel times, and calculate potential fuel costs. The planner integrates with Google Maps for routing and place searches.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Inputs:</strong> Provide Start Location, End Location (with Google Places Autocomplete), Planned Date Range, Vehicle Fuel Efficiency (L/100km), and Current Fuel Price (per liter). You can also add trip notes.</li>
            <li><strong>Route Calculation:</strong> Displays the route on an interactive map, showing total distance, estimated travel duration, estimated fuel needed, and total fuel cost based on your inputs.</li>
            <li><strong>Map Features:</strong> Start and End locations are marked on the map. You can search for "Nearby Attractions" within the current map view.</li>
            <li><strong>Navigation:</strong> A "Navigate" button opens the calculated route in Google Maps in a new tab for turn-by-turn navigation.</li>
            <li><strong>Saving Trips:</strong> Saves the current plan (including route details, fuel estimates, dates, and notes) to your "Trip Log." This also creates a unique, editable checklist for the trip based on the active caravan's default or a global template.</li>
            <li><strong>Recalling Trips:</strong> You can load previously saved trips from the "Trip Log" back into the planner for review or modification.</li>
        </ul>
        <p className="mt-2"><strong>API Key Note:</strong> The Trip Planner requires a Google Maps API Key (configured as <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment) for map rendering, place autocomplete, and route calculation features.</p>
        </>
      )
    },
    {
      title: "6. Trip Log (/triplog)",
      icon: History,
      content: (
        <>
          <p>View and manage all your saved trips from the Trip Planner. Trips are displayed as cards with key details.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Trip Cards:</strong> Each card shows the trip name, saved date, start/end locations, date range, route distance/duration, and fuel estimates if available.</li>
            <li><strong>Actions per Trip:</strong>
                <ul className="list-circle pl-5">
                    <li><strong>"Start Trip" / "View Checklists":</strong> Navigates to the checklists page, pre-selecting the checklist for that specific trip. The button text changes based on whether the trip is marked completed.</li>
                    <li><strong>"Mark Completed" / "Reopen Trip":</strong> Toggles the trip's completion status. Completed trips are visually distinct.</li>
                    <li><strong>"Calendar":</strong> Opens a pre-filled Google Calendar event in a new tab to easily add the trip to your calendar (requires a start date).</li>
                    <li><strong>"Recall":</strong> Loads the trip data back into the Trip Planner for editing or re-planning.</li>
                    <li><strong>"Delete":</strong> Permanently removes the trip from your log (confirmation required).</li>
                </ul>
            </li>
        </ul>
        </>
      )
    },
    {
      title: "7. Bookings (/bookings)",
      icon: BedDouble,
      content: (
        <>
          <p>Manually log your accommodation and campsite bookings. KamperHub does not integrate directly with booking platforms for automated tracking; this section is for your personal record-keeping.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Add New Booking:</strong> A form allows you to enter details such as site name, check-in/check-out dates, location/address, contact phone/website, confirmation number, and any notes.</li>
            <li><strong>Booking List:</strong> Displays all your logged bookings, sorted by check-in date (most recent first). You can edit or delete existing bookings.</li>
            <li><strong>Book Your Stay (Affiliate Links):</strong> This section provides quick links to popular booking platforms (e.g., Booking.com, Airbnb, national park websites). These are sample links and may require you to replace placeholder affiliate IDs with your own if you intend to use them for affiliate marketing.</li>
        </ul>
        </>
      )
    },
    {
      title: "8. Support & Learn (/learn)",
      icon: BookOpen,
      content: (
        <>
          <p>Find resources to help you with your caravanning journey. This page is organized into tabs:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Educational Videos:</strong> A curated list of YouTube videos covering various topics like setup, driving, maintenance, and safety.</li>
            <li><strong>Articles & Guides:</strong> Static articles providing helpful information and guides on common caravanning topics.</li>
            <li><strong>AI Chatbot:</strong> An interactive AI assistant (powered by Genkit and Google's Gemini models) to answer your caravanning questions. It can access a small internal FAQ and search the static articles for relevant information.</li>
            <li><strong>User Manual:</strong> This document, providing an overview of KamperHub's features (you are here!).</li>
        </ul>
        </>
      )
    },
    {
      title: "9. My Account (/my-account) & Subscriptions",
      icon: UserCircle,
      content: (
         <>
            <p>Manage your KamperHub user profile and subscription details.</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>User Profile:</strong> View your display name, email, and other profile details like name and location. Use the "Edit Profile" button to update this information. Email changes are handled by Firebase Authentication and may require re-authentication.</li>
                <li>
                  <strong>Subscription Model:</strong>
                  <ul className="list-circle pl-5 space-y-1 mt-1">
                    <li><strong>Automatic 7-Day Pro Trial:</strong> Upon signing up for KamperHub, you automatically receive a 7-day free trial of all Pro features. No payment details are required to start this trial. Your account will be marked as 'trialing', and you can see the trial end date on the "My Account" page.</li>
                    <li><strong>Subscribing to Pro:</strong> If you wish to continue using Pro features after your trial ends, or if you want to subscribe at any time, navigate to the "My Account" page. Click the "Subscribe to KamperHub Pro" button. This will redirect you to Stripe to enter your payment details and start an immediate paid subscription (this does not start another trial).</li>
                    <li><strong>Free Tier:</strong> If you do not subscribe to Pro after your trial, your account will revert to the free tier, and access to Pro-specific features or limits (e.g., adding more than one vehicle/caravan) will be restricted.</li>
                  </ul>
                </li>
                <li><strong>Manage Active Subscription:</strong> If you have an active paid Pro subscription, a "Manage Subscription in Stripe" button will appear. Clicking this will securely redirect you to your Stripe Customer Portal, where you can update payment methods, view invoices, or cancel your subscription directly with Stripe.</li>
                <li><strong>Logout:</strong> Securely sign out of your KamperHub account.</li>
            </ul>
        </>
      )
    }
  ];

  return (
    <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl mx-auto p-1 space-y-4 font-body text-foreground">
      <h2 className="font-headline text-2xl text-primary border-b pb-2 mb-4">KamperHub User Manual</h2>

      <p>Welcome to KamperHub, your ultimate caravanning companion! This manual will guide you through the features of the app to help you plan, manage, and enjoy your adventures.</p>

      <Accordion type="single" collapsible className="w-full">
        {manualSections.map((section, index) => (
          <AccordionItem value={`item-${index + 1}`} key={index} className={cn(section.isAlertSection ? "border-destructive" : "")}>
            <AccordionTrigger className={cn(
                "text-left hover:no-underline",
                 section.isAlertSection ? "text-destructive hover:text-destructive/90" : "text-primary"
              )}
            >
              <span className={cn(
                "flex items-center font-headline text-lg",
                 section.isAlertSection ? "text-destructive" : "text-primary"
                )}
              >
                <section.icon className={cn("mr-3 h-5 w-5", section.isAlertSection ? "text-destructive" : "text-primary/80")} />
                {section.title}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className={cn(
                "prose prose-sm sm:prose-base max-w-none font-body",
                section.isAlertSection ? "text-destructive/90" : "text-foreground"
                )}
              >
                {section.content}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <hr className="my-6"/>
      <p className="text-center text-muted-foreground">We hope this manual helps you make the most of KamperHub. Happy travels!</p>
    </div>
  );
}
