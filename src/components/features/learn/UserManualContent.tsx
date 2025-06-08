
// src/components/features/learn/UserManualContent.tsx

export function UserManualContent() {
  return (
    <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl mx-auto p-1 space-y-4 font-body text-foreground">
      <h2 className="font-headline text-2xl text-primary border-b pb-2 mb-4">KamperHub User Manual</h2>

      <p>Welcome to KamperHub, your ultimate caravanning companion! This manual will guide you through the features of the app to help you plan, manage, and enjoy your adventures.</p>

      <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <h3 className="font-headline text-lg text-destructive mb-2">Important Note on Data Storage:</h3>
        <p className="mb-2 text-destructive/90">KamperHub stores all your data (vehicles, caravans, inventory, trips, checklists, bookings) locally in your web browser's storage. This means:</p>
        <ul className="list-disc pl-5 space-y-1 text-destructive/90">
          <li>Your data is private to your browser on your device.</li>
          <li>Clearing your browser's cache or site data for KamperHub will <strong>permanently delete all your saved information.</strong></li>
          <li>Data is not automatically synced across different devices or browsers.</li>
        </ul>
      </div>

      <section className="space-y-2">
        <h3 className="font-headline text-xl text-primary pt-3 border-t mt-6">1. Dashboard</h3>
        <p>The Dashboard is your home screen, providing quick access to all of KamperHub's features. Each card represents a core section of the app.</p>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline text-xl text-primary pt-3 border-t mt-6">2. Vehicle, Caravan, Storage &amp; WDH Data (<code>/vehicles</code>)</h3>
        <p>This section is crucial for setting up the foundational data for your rig. Accurate information here powers features like the Trip Planner and Inventory &amp; Weight Management.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <h4 className="font-semibold font-headline text-md text-foreground">Tow Vehicles:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Add/Edit:</strong> Record details like make, model, year, GVM (Gross Vehicle Mass), GCM (Gross Combined Mass), max towing capacity, max towball mass, fuel efficiency, kerb weight, axle limits, and wheelbase.</li>
              <li><strong>Storage Locations:</strong> Define specific storage areas within your tow vehicle (e.g., "Boot," "Roof Box"), specifying their position and optional weight capacities. This helps with detailed weight distribution in the Inventory section.</li>
              <li><strong>Set Active:</strong> You can mark one tow vehicle as "Active." This active vehicle's specifications (especially fuel efficiency) will be used by default in the Trip Planner.</li>
            </ul>
          </li>
          <li>
            <h4 className="font-semibold font-headline text-md text-foreground">Caravans:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Add/Edit:</strong> Input details like make, model, year, Tare Mass, ATM (Aggregate Trailer Mass), GTM (Gross Trailer Mass), max towball download, number of axles, and dimensions (overall length, body length, etc.).</li>
              <li><strong>Storage Locations:</strong> Similar to vehicles, define specific storage areas within your caravan (e.g., "Front Boot," "Under Bed Storage"), their positions, and optional weight capacities for precise inventory management.</li>
              <li><strong>Water Tanks:</strong> Add details for each water tank (fresh, grey, black), including its name, capacity, and position. This is used in the Inventory section to calculate water weight.</li>
              <li><strong>Associate WDH:</strong> Link a saved Weight Distribution Hitch to the caravan.</li>
              <li><strong>Set Active:</strong> Mark one caravan as "Active." The active caravan's specifications are used in the Inventory &amp; Weight Management and for generating default checklists for new trips.</li>
            </ul>
          </li>
          <li>
            <h4 className="font-semibold font-headline text-md text-foreground">Weight Distribution Hitches (WDHs):</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Add/Edit:</strong> Store information about your WDHs, including name/model, type, max/min towball capacity, and whether it has integrated sway control.</li>
              <li><strong>Set Active:</strong> You can set one WDH as "Active." This is mainly for reference in the Inventory &amp; Weight Management section. If a caravan with an associated WDH is made active, its WDH will also become active.</li>
            </ul>
          </li>
        </ul>
        <p className="text-sm"><strong>Subscription Note:</strong> The free version of KamperHub allows you to add 1 tow vehicle, 1 caravan, and 1 WDH. Upgrade to Pro via the "Subscribe" page for unlimited entries.</p>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline text-xl text-primary pt-3 border-t mt-6">3. Inventory &amp; Weight Management (<code>/inventory</code>)</h3>
        <p>This powerful tool helps you track items in your active caravan, manage their weights, and monitor compliance with various weight limits.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><h4 className="font-semibold font-headline text-md text-foreground">Active Caravan &amp; Vehicle:</h4> <p className="text-sm -mt-1">This page relies heavily on the "Active" caravan and "Active" tow vehicle set in the <code>/vehicles</code> section. Ensure these are correctly selected for accurate calculations.</p></li>
          <li><h4 className="font-semibold font-headline text-md text-foreground">Adding Items:</h4> <p className="text-sm -mt-1">Input item name, weight (per item), quantity, and assign it to a predefined storage location (from your active caravan or vehicle's setup).</p></li>
          <li><h4 className="font-semibold font-headline text-md text-foreground">Water Tank Levels:</h4> <p className="text-sm -mt-1">Adjust the fill percentage for each water tank defined for your active caravan. The weight of the water (1kg per liter) is automatically calculated and added to your caravan's total mass.</p></li>
          <li>
            <h4 className="font-semibold font-headline text-md text-foreground">Weight Summary &amp; Compliance:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Visual Charts:</strong> Donut charts provide a quick visual overview of your Caravan ATM, GTM, and estimated Towball Mass against their limits.</li>
              <li><strong>Detailed Alerts:</strong> Caravan Compliance, Tow Vehicle Compliance, WDH Compatibility, and Storage Location Loads are monitored.</li>
            </ul>
          </li>
          <li><h4 className="font-semibold font-headline text-md text-foreground">Weighbridge Notice:</h4><p className="text-sm -mt-1">Always verify your actual weights at a certified weighbridge. KamperHub provides estimates based on your input.</p></li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline text-xl text-primary pt-3 border-t mt-6">4. Checklists (<code>/checklists</code>)</h3>
        <p>KamperHub offers a flexible checklist system to ensure you don't miss crucial steps.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <h4 className="font-semibold font-headline text-md text-foreground">Two Types of Checklists:</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li><strong>Caravan Default Checklists:</strong> Create reusable defaults (Pre-Departure, Campsite Setup, Pack-Down) for each caravan. Find this under "Manage Caravan Defaults."</li>
              <li><strong>Trip-Specific Checklists:</strong> Automatically created when a trip is saved. Uses caravan default if available, otherwise a global template. Managed under "Manage Trip Checklists."</li>
            </ol>
          </li>
          <li><h4 className="font-semibold font-headline text-md text-foreground">Using Checklists:</h4> <p className="text-sm -mt-1">Tick off items as completed; the state is saved for that specific trip.</p></li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline text-xl text-primary pt-3 border-t mt-6">5. Trip Planner (<code>/tripplanner</code>)</h3>
        <p>Plan your routes, estimate travel times, and calculate potential fuel costs.</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Inputs:</strong> Start/End Location, Date Range, Fuel Efficiency, Fuel Price, Trip Notes.</li>
            <li><strong>Route Calculation:</strong> Displays route on map, shows distance, duration, fuel needed, and cost.</li>
            <li><strong>Map Features:</strong> Markers for start/end, "Nearby Attractions" search.</li>
            <li><strong>Navigation:</strong> "Navigate" button opens the route in Google Maps.</li>
            <li><strong>Saving Trips:</strong> Adds trip to "Trip Log" and creates a checklist.</li>
            <li><strong>Recalling Trips:</strong> Load saved trips from "Trip Log" for editing.</li>
        </ul>
        <p className="text-sm"><strong>API Key Note:</strong> The Trip Planner requires a Google Maps API Key (<code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>) for map and routing features.</p>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline text-xl text-primary pt-3 border-t mt-6">6. Trip Log (<code>/triplog</code>)</h3>
        <p>View and manage all your saved trips.</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Trip Cards:</strong> Displays trip details (name, dates, locations, route, fuel).</li>
            <li><strong>Actions per Trip:</strong>
                <ul className="list-circle pl-5">
                    <li>"Start Trip" / "View Checklists": Navigates to checklists (specific to that trip).</li>
                    <li>"Mark Completed" / "Reopen Trip": Toggles trip completion status.</li>
                    <li>"Calendar": Adds trip to Google Calendar.</li>
                    <li>"Recall": Loads trip into Trip Planner.</li>
                    <li>"Delete": Removes trip from log.</li>
                </ul>
            </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline text-xl text-primary pt-3 border-t mt-6">7. Bookings (<code>/bookings</code>)</h3>
        <p>Manually log your accommodation and campsite bookings. KamperHub does not integrate directly with booking platforms for automated tracking.</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Add New Booking:</strong> Enter site name, dates, location, contact, confirmation, notes.</li>
            <li><strong>Booking List:</strong> View, edit, or delete logged bookings.</li>
            <li><strong>Book Your Stay (Affiliate Links):</strong> Quick links to booking platforms (sample links, may require your own affiliate IDs).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline text-xl text-primary pt-3 border-t mt-6">8. Support (<code>/learn</code>)</h3>
        <p>Find resources to help you with your caravanning journey. This page is organized into tabs:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Educational Videos:</strong> Curated YouTube videos on setup, driving, maintenance, safety.</li>
            <li><strong>Articles & Guides:</strong> Helpful articles and guides.</li>
            <li><strong>AI Chatbot:</strong> Ask caravanning questions.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline text-xl text-primary pt-3 border-t mt-6">9. Subscribe (<code>/subscribe</code>)</h3>
        <p>This page outlines the (conceptual) KamperHub Pro subscription.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Free Tier Limits:</strong> 1 vehicle, 1 caravan, 1 WDH.</li>
            <li><strong>Pro Benefits:</strong> (Conceptual) Unlimited entries, premium features.</li>
            <li><strong>Stripe Integration (Conceptual):</strong> Demonstrates Stripe checkout. Requires your Stripe keys (<code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>, <code>STRIPE_PRICE_ID</code>).</li>
            <li><strong>Subscription Status (Mocked):</strong> Simulated using local browser storage for demo.</li>
        </ul>
      </section>

      <hr className="my-6"/>
      <p className="text-center text-muted-foreground">We hope this manual helps you make the most of KamperHub. Happy travels!</p>
    </div>
  );
}

    