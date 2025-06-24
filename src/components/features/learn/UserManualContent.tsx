// src/components/features/learn/UserManualContent.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, Settings2, Backpack, ListChecks, Route as RouteIcon, History, BedDouble, BookOpen, ShieldAlert, UserCircle, DollarSign } from 'lucide-react';
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
        <li>Trip plans and logged trips, including budgets and expenses</li>
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
      title: "2. Vehicle, Caravan, Storage & WDH Data",
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
                <li><strong>Set Active:</strong> You can mark one tow vehicle as "Active." This active vehicle's specifications (especially fuel efficiency and weight limits) will be used by default in the Trip Planner and for compliance calculations in the Inventory section.</li>
              </ul>
            </li>
            <li>
              <h4 className="font-semibold font-headline text-md text-foreground">Caravans:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Add/Edit:</strong> Input details like make, model, year, Tare Mass, ATM (Aggregate Trailer Mass), GTM (Gross Trailer Mass), max towball download, number of axles, and various dimensions.</li>
                <li><strong>Storage Locations:</strong> Similar to vehicles, define specific storage areas within your caravan (e.g., "Front Boot," "Under Bed Storage"), their positions, and optional weight capacities for precise inventory management.</li>
                <li><strong>Water Tanks:</strong> Add details for each water tank (fresh, grey, black), including its name, capacity (in Liters), and position. This is used in the Inventory section to calculate water weight.</li>
                <li><strong>Diagrams:</strong> You can associate links to important documents like floor plans or wiring schematics for easy reference.</li>
                <li><strong>Associate WDH:</strong> Link a saved Weight Distribution Hitch (WDH) to the caravan.</li>
                <li><strong>Set Active:</strong> Mark one caravan as "Active." The active caravan's specifications are used in the Inventory & Weight Management page and for generating default checklists for new trips.</li>
              </ul>
            </li>
            <li>
              <h4 className="font-semibold font-headline text-md text-foreground">Weight Distribution Hitches (WDHs):</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Add/Edit:</strong> Store information about your WDHs, including name/model, type, maximum and optional minimum towball capacity, and sway control details.</li>
                <li><strong>Set Active:</strong> You can set one WDH as "Active." This is mainly for reference and compliance checks in the Inventory & Weight Management section. If a caravan with an associated WDH is made active, its WDH will also become active.</li>
              </ul>
            </li>
          </ul>
          <p className="text-sm"><strong>Subscription Note:</strong> The free version of KamperHub allows you to add 1 tow vehicle, 1 caravan, and 1 WDH. Upgrade to Pro for unlimited entries.</p>
        </>
      )
    },
    {
      title: "3. Inventory & Weight Management",
      icon: Backpack,
      content: (
         <>
          <p>This powerful tool helps you track items loaded into your active caravan and vehicle, manage their weights, and monitor compliance with various weight limits (ATM, GTM, Towball Mass, GVM, GCM).</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Active Selections:</strong> This page relies heavily on the "Active" caravan, "Active" tow vehicle, and "Active" WDH set in the "Vehicle, Caravan, Storage & WDH Data" section. Ensure these are correctly selected for accurate calculations and relevant storage locations.</li>
            <li><strong>Adding Items:</strong> Input item name, weight (per item), quantity, and assign it to a predefined storage location from your active caravan or vehicle. Items assigned to the caravan contribute to its payload, while items in the vehicle contribute to its GVM.</li>
            <li><strong>Water Tank Levels:</strong> Adjust the fill percentage for each water tank defined for your active caravan. The weight of the water (1kg per liter) is automatically calculated and added to your caravan's total mass.</li>
            <li><strong>Weight Summary & Compliance:</strong>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Visual Charts:</strong> Donut charts provide a quick visual overview of your Caravan ATM, GTM, and estimated Towball Mass against their respective limits.</li>
                    <li><strong>Detailed Alerts & Status:</strong> The system provides alerts for Caravan Compliance (ATM, GTM, Towball), Tow Vehicle Compliance (Max Tow Capacity, Vehicle Max Towball, GVM, and GCM advisory), and WDH Compatibility.</li>
                </ul>
            </li>
            <li><strong>Weighbridge Notice:</strong> Always verify your actual weights at a certified weighbridge. KamperHub provides estimates based on your input, but real-world weights can vary.</li>
        </ul>
        </>
      )
    },
    {
      title: "4. Checklists",
      icon: ListChecks,
      content: (
        <>
          <p>KamperHub offers a flexible checklist system to ensure you don't miss crucial steps. All checklist data is saved to your account and available across devices.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Two Types of Checklists:</strong>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong>Caravan Default Checklists:</strong> Define a default set of checklists (Pre-Departure, Campsite Setup, Pack-Down) for each of your caravans. This template will be used for new trips planned with that specific caravan.</li>
                <li><strong>Trip-Specific Checklists:</strong> When you save a trip, a unique checklist set is created for it, copied from the active caravan's default. Modifications here only affect this specific trip.</li>
              </ol>
            </li>
            <li><strong>Using Checklists:</strong> You can add, delete, reorder, and mark items as completed. The completion status is saved for each specific trip's checklist or caravan default.</li>
          </ul>
        </>
      )
    },
    {
      title: "5. Trip & Expense Planner",
      icon: RouteIcon,
      content: (
        <>
          <p>Plan your routes, estimate travel times, calculate fuel costs, set budgets, and track expenses. This is your all-in-one travel command center.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Itinerary Planning:</strong>
                <ul className="list-circle pl-5 space-y-1">
                    <li><strong>Inputs:</strong> Provide Start and End Locations (with Google Places Autocomplete), Planned Date Range, Vehicle Fuel Efficiency (L/100km), and Current Fuel Price.</li>
                    <li><strong>Route Calculation:</strong> Displays the route on an interactive map, showing total distance, estimated duration, and calculated fuel cost.</li>
                    <li><strong>Saving Trips:</strong> Saves the entire plan—including the route, fuel estimates, dates, budget, expenses, and notes—to your "Trip Log." This also creates a unique, editable checklist for the trip.</li>
                </ul>
            </li>
            <li><strong>Budgeting:</strong>
                <ul className="list-circle pl-5 space-y-1">
                    <li>Once an itinerary is planned, switch to the "Budget" tab.</li>
                    <li>Create spending categories like "Fuel," "Groceries," "Accommodation," "Activities," etc.</li>
                    <li>Assign a budgeted amount to each category. The total trip budget is automatically calculated.</li>
                    <li>When you save a trip, the estimated fuel cost will automatically populate or update the "Fuel" budget category.</li>
                </ul>
            </li>
             <li><strong>Expense Tracking:</strong>
                <ul className="list-circle pl-5 space-y-1">
                    <li>In the "Expenses" tab, you can log individual expenses as they occur.</li>
                    <li>Each expense requires a description, amount, date, and must be assigned to one of your created budget categories.</li>
                    <li>The system keeps a running total of your spending against your overall budget.</li>
                </ul>
            </li>
        </ul>
        <p className="mt-2"><strong>API Key Note:</strong> The Trip Planner requires a Google Maps API Key for map rendering, place autocomplete, and route calculation features.</p>
        </>
      )
    },
    {
      title: "6. Trip Log",
      icon: History,
      content: (
        <>
          <p>View and manage all your saved trips. Trips are displayed as cards with key details.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Trip Cards:</strong> Each card shows the trip name, saved date, start/end locations, date range, route distance/duration, and fuel estimates if available.</li>
            <li><strong>Actions per Trip:</strong>
                <ul className="list-circle pl-5">
                    <li><strong>"Start Trip" / "View Checklists":</strong> Navigates to the checklists page, pre-selecting the checklist for that specific trip.</li>
                    <li><strong>"Mark Completed" / "Reopen Trip":</strong> Toggles the trip's completion status.</li>
                    <li><strong>"Calendar":</strong> Opens a pre-filled Google Calendar event to easily add the trip to your calendar.</li>
                    <li><strong>"Recall":</strong> Loads the trip data, including its budget and expenses, back into the Trip Planner for review or modification.</li>
                    <li><strong>"Delete":</strong> Permanently removes the trip and all associated data from your log.</li>
                </ul>
            </li>
        </ul>
        </>
      )
    },
    {
      title: "7. Bookings",
      icon: BedDouble,
      content: (
        <>
          <p>Manually log your accommodation and campsite bookings. This section is for your personal record-keeping.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Add New Booking:</strong> A form allows you to enter booking details. You can optionally enter a "Budgeted Cost" and "Assign to Trip."</li>
            <li><strong>Budget Integration:</strong> If you assign a booking with a cost to a trip, that cost is automatically added to the "Accommodation" category in that trip's budget. This helps keep your trip financials accurate.</li>
            <li><strong>Booking List:</strong> Displays all your logged bookings. You can edit or delete existing bookings.</li>
            <li><strong>Book Your Stay (Affiliate Links):</strong> This section provides quick links to popular booking platforms.</li>
        </ul>
        </>
      )
    },
    {
      title: "8. Support & Learn",
      icon: BookOpen,
      content: (
        <>
          <p>Find resources to help you with your caravanning journey. This page is organized into tabs:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Educational Videos:</strong> A curated list of YouTube videos covering various topics like setup, driving, maintenance, and safety.</li>
            <li><strong>Articles & Guides:</strong> Helpful articles providing information on common caravanning topics.</li>
            <li><strong>AI Chatbot:</strong> An interactive AI assistant to answer your caravanning questions. It can access a small internal FAQ and search the static articles for relevant information.</li>
            <li><strong>User Manual:</strong> This document, providing an overview of KamperHub's features (you are here!).</li>
            <li><strong>Terms of Service:</strong> The legal terms and conditions for using KamperHub.</li>
        </ul>
        </>
      )
    },
    {
      title: "9. My Account & Subscriptions",
      icon: UserCircle,
      content: (
         <>
            <p>Manage your KamperHub user profile and subscription details.</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>User Profile:</strong> View your display name, email, and other profile details. Use the "Edit Profile" button to update this information. Email changes are handled securely and may require re-authentication.</li>
                <li>
                  <strong>Subscription Model:</strong>
                  <ul className="list-circle pl-5 space-y-1 mt-1">
                    <li><strong>Automatic 7-Day Pro Trial:</strong> Upon signing up, you automatically receive a 7-day free trial of all Pro features (like unlimited vehicles). No payment details are required to start this trial. Your trial end date is shown on the "My Account" page.</li>
                    <li><strong>Subscribing to Pro:</strong> To continue using Pro features after your trial, or to subscribe at any time, click the "Upgrade to KamperHub Pro" button. This will securely redirect you to Stripe to enter your payment details and start a paid subscription.</li>
                    <li><strong>Free Tier:</strong> If you do not subscribe to Pro after your trial, your account will revert to the free tier, and access to Pro-specific features will be restricted.</li>
                  </ul>
                </li>
                <li><strong>Manage Active Subscription:</strong> If you have an active paid Pro subscription, a "Manage Subscription in Stripe" button will appear. This redirects you to a secure Stripe Customer Portal where you can update payment methods, view invoices, or cancel your subscription.</li>
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

    
