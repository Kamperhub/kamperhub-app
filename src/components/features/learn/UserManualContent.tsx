
"use client";

// src/components/features/learn/UserManualContent.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LayoutDashboard, Settings2, Backpack, ListChecks, Briefcase, BedDouble, BookOpen, UserCircle, FileText, Fuel } from 'lucide-react';

export function UserManualContent() {
  const manualSections = [
    {
      title: "1. Dashboard",
      icon: LayoutDashboard,
      content: (
        <>
          <p>The Dashboard is your home screen. The main section contains draggable cards for quick access to all of KamperHub's features. On a desktop computer, you can drag and drop these cards to customize the layout to your preference. This layout is saved to your account and will sync across devices.</p>
          <p>The "Dashboard Hub" provides access to secondary features like the new Document Locker, your Travel Statistics, and the upcoming Rewards Program.</p>
        </>
      )
    },
    {
      title: "2. Vehicle & Caravan Setup",
      icon: Settings2,
      content: (
        <>
          <p>This section is crucial for setting up the foundational data for your rig. Accurate information here powers features like the Trip Planner and Inventory & Weight Management.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <h4 className="font-semibold font-headline text-md text-foreground">Tow Vehicles:</h4>
              <p className="text-sm">Record details like make, model, year, GVM (Gross Vehicle Mass), GCM (Gross Combined Mass), max towing capacity, fuel efficiency, and define specific storage areas within your tow vehicle (e.g., "Boot," "Roof Box"). Mark one vehicle as "Active" to use its specs in calculations.</p>
            </li>
            <li>
              <h4 className="font-semibold font-headline text-md text-foreground">Caravans/Rigs:</h4>
              <p className="text-sm">Input details for any type of camping rig, from a simple "Tent" or "Utility Trailer" to a large "Fifth Wheeler". You can manage Weight Distribution Hitch (WDH) settings, define internal storage locations, and list your water tanks. Mark one rig as "Active" for use in the Inventory page.</p>
            </li>
          </ul>
          <p className="text-sm"><strong>Subscription Note:</strong> The free version of KamperHub allows you to add 1 tow vehicle and 1 caravan/rig. Upgrade to Pro for unlimited entries.</p>
        </>
      )
    },
     {
      title: "3. Document Locker",
      icon: FileText,
      content: (
        <>
          <p>The Document Locker, accessible from the "Dashboard Hub," is a central, secure place for all your important travel-related files. Instead of attaching diagrams to specific caravans, you can now manage all documents in one place.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <h4 className="font-semibold font-headline text-md text-foreground">How it Works:</h4>
              <p className="text-sm">To add a document, you must first upload it to a secure cloud storage service (like Google Drive, Dropbox, or Firebase Storage). Then, create a public sharing link for that file.</p>
            </li>
             <li>
              <h4 className="font-semibold font-headline text-md text-foreground">Adding a Document:</h4>
              <p className="text-sm">Click "Add Document", give your document a clear name (e.g., "Caravan Insurance Policy 2025"), paste the public sharing link into the "File URL" field, and add any relevant tags or descriptions. This creates a secure, easy-to-access link to your file directly within KamperHub.</p>
            </li>
          </ul>
        </>
      )
    },
    {
      title: "4. Inventory & Weight Management",
      icon: Backpack,
      content: (
         <>
          <p>This powerful tool helps you track items loaded into your active caravan and vehicle, manage their weights, and monitor compliance with various weight limits (ATM, GTM, Towball Mass, GVM, GCM).</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Active Selections:</strong> This page relies on the "Active" caravan and "Active" tow vehicle set in the "Vehicle & Caravan Setup" section for its calculations.</li>
            <li><strong>Adding Items:</strong> Input an item's name, weight, quantity, and assign it to a predefined storage location from your active caravan or vehicle.</li>
            <li><strong>Occupant Weight:</strong> Select a saved trip to automatically include the weight of the occupants from that trip in the vehicle's GVM calculation.</li>
            <li>
              <h4 className="font-semibold font-headline text-md text-foreground">Advanced Weight Summary:</h4>
              <p className="text-sm">The "Calculated Towball Mass" uses a physics-based moment calculation, considering the weight of each item and its distance from the caravan's axle center. This provides a more accurate estimate than a simple percentage. Visual charts help you monitor your ATM, Axle Load, and Towball Mass against their limits.</p>
            </li>
          </ul>
        </>
      )
    },
    {
      title: "5. Trip Manager & Journeys",
      icon: Briefcase,
      content: (
        <>
          <p>The Trip Manager is the central hub for all your travel planning activities.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
                <strong>Journeys:</strong> Group multiple individual trips into a single adventure (e.g., "The Big Lap 2025"). Each Journey has a master map showing the combined route of all its trips, an aggregated financial summary, and a strategic AI packing planner.
            </li>
            <li>
                <strong>Trip Planner:</strong> Plan individual trip legs with Google Maps, factoring in vehicle height. Get estimates for distance, duration, and fuel, and track budgets and expenses for each trip.
            </li>
            <li><strong>Trip Log:</strong> Review your past adventures, recall saved trips for re-planning, and mark trips as complete.</li>
            <li><strong>Trip Packing Assistant:</strong> Use our AI assistant to generate smart packing lists.</li>
            <li><strong>World Map:</strong> View all your completed trips on a global map.</li>
        </ul>
        </>
      )
    },
    {
      title: "6. Service & Fuel Log",
      icon: Fuel,
      content: (
        <>
          <p>Keep a detailed history of your fuel consumption and maintenance tasks for all your registered vehicles and caravans. This feature helps you monitor running costs and stay on top of your service schedule.</p>
           <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Fuel Log:</strong> Record every fill-up by selecting a vehicle, and entering the date, odometer reading, litres, price per litre, and total cost. The app will help you track fuel efficiency over time.
            </li>
            <li>
              <strong>Maintenance Log:</strong> Log all service and repair tasks. Record the task name, date, cost, service provider, and any relevant notes to maintain a complete service history for your rig.
            </li>
          </ul>
        </>
      )
    },
    {
      title: "7. Checklists",
      icon: ListChecks,
      content: (
        <>
          <p>KamperHub's checklist feature provides a guided, procedural flow for safety and convenience. Checklists are tied to a specific trip.</p>
           <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Procedural Flow:</strong> The checklist is a single page broken down into logical stages (e.g., "Vehicle Pre-Travel Checks," "Hitching Up").
            </li>
            <li>
              <strong>Start Navigation:</strong> For safety, the "Start Navigation" button is disabled until all items in every stage are checked off. Once progress reaches 100%, you can launch Google Maps with your pre-planned route.
            </li>
          </ul>
        </>
      )
    },
    {
      title: "8. Bookings",
      icon: BedDouble,
      content: (
        <>
          <p>Manually log your accommodation and campsite bookings. If you assign a booking with a cost to a trip, that cost is automatically added to the "Accommodation" category in that trip's budget. This section also provides affiliate links to popular booking platforms.</p>
        </>
      )
    },
    {
      title: "9. Support & Learn",
      icon: BookOpen,
      content: (
        <>
          <p>Find resources to help you with your caravanning journey, including Articles, the AI Chatbot (which can now answer questions about your saved trips and vehicles), this User Manual, and our Terms of Service.</p>
        </>
      )
    },
    {
      title: "10. My Account & Subscriptions",
      icon: UserCircle,
      content: (
         <>
            <p>Manage your KamperHub user profile and subscription details.</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>User Profile:</strong> View and edit your display name, email, and other profile details.</li>
                 <li>
                    <strong>Integrations:</strong> Connect your KamperHub account to your Google Account to enable creating packing lists directly in Google Tasks.
                </li>
                <li>
                  <strong>Subscription:</strong> All new accounts start with a 7-day free trial of Pro features. You can subscribe to Pro via Stripe or manage an existing subscription from this page.
                </li>
            </ul>
        </>
      )
    }
  ];

  return (
    <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl mx-auto p-1 space-y-4 font-body text-foreground">
      <h2 className="font-headline text-2xl text-primary border-b pb-2 mb-4">KamperHub User Manual</h2>

      <p>Welcome to KamperHub! This manual will guide you through the features of the app. All your data—from vehicles to trip plans—is saved securely to your account and is available on any device.</p>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
        {manualSections.map((section, index) => (
          <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger className="text-left hover:no-underline text-primary">
              <span className="flex items-center font-headline text-lg text-primary">
                <section.icon className="mr-3 h-5 w-5 text-primary/80" />
                {section.title}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="prose prose-sm sm:prose-base max-w-none font-body text-foreground">
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
