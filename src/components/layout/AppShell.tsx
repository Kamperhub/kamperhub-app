
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { APIProvider } from '@vis.gl/react-google-maps';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

// --- BEGIN MIGRATION LOGIC ---
// Import all known localStorage keys
import { VEHICLES_STORAGE_KEY, ACTIVE_VEHICLE_ID_KEY } from '@/types/vehicle';
import { CARAVANS_STORAGE_KEY, ACTIVE_CARAVAN_ID_KEY } from '@/types/caravan';
import { WDHS_STORAGE_KEY, ACTIVE_WDH_ID_KEY } from '@/types/wdh';
import { INVENTORY_STORAGE_KEY } from '@/types/inventory';
import { TRIP_LOG_STORAGE_KEY } from '@/types/tripplanner';
import { BOOKINGS_STORAGE_KEY } from '@/types/booking';
import { CARAVAN_DEFAULT_CHECKLISTS_STORAGE_KEY } from '@/types/checklist';

// These keys were not exported but were used in components
const DASHBOARD_LAYOUT_STORAGE_KEY = 'kamperhub_dashboard_layout';
const WATER_LEVELS_STORAGE_KEY = 'kamperhub_water_tank_levels'; // Assumed key based on plan

const MIGRATION_FLAG_KEY = 'kamperhub_firestore_migrated_v1';

async function performMigration(user: FirebaseUser, toast: (options: any) => void) {
    console.log("[Migration] Checking if data migration is needed...");
    if (localStorage.getItem(MIGRATION_FLAG_KEY)) {
        console.log("[Migration] Migration flag found. Skipping.");
        return;
    }

    const parseJson = (jsonString: string | null) => {
        try {
            return jsonString ? JSON.parse(jsonString) : undefined;
        } catch (e) {
            console.warn("[Migration] Could not parse JSON string:", jsonString, e);
            return undefined;
        }
    };
    
    const migrationPayload = {
        vehicles: parseJson(localStorage.getItem(VEHICLES_STORAGE_KEY)),
        caravans: parseJson(localStorage.getItem(CARAVANS_STORAGE_KEY)),
        wdhs: parseJson(localStorage.getItem(WDHS_STORAGE_KEY)),
        inventories: parseJson(localStorage.getItem(INVENTORY_STORAGE_KEY)),
        trips: parseJson(localStorage.getItem(TRIP_LOG_STORAGE_KEY)),
        bookings: parseJson(localStorage.getItem(BOOKINGS_STORAGE_KEY)),
        userPreferences: {
            activeVehicleId: localStorage.getItem(ACTIVE_VEHICLE_ID_KEY),
            activeCaravanId: localStorage.getItem(ACTIVE_CARAVAN_ID_KEY),
            activeWdhId: localStorage.getItem(ACTIVE_WDH_ID_KEY),
            dashboardLayout: parseJson(localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY)),
            caravanWaterLevels: parseJson(localStorage.getItem(WATER_LEVELS_STORAGE_KEY)),
            caravanDefaultChecklists: parseJson(localStorage.getItem(CARAVAN_DEFAULT_CHECKLISTS_STORAGE_KEY))
        }
    };
    
    const hasDataToMigrate = Object.values(migrationPayload).some(data => {
        if (data === undefined || data === null) return false;
        if (typeof data === 'object' && !Array.isArray(data)) {
            return Object.values(data).some(subData => subData !== null && subData !== undefined);
        }
        return Array.isArray(data) ? data.length > 0 : false;
    });

    if (!hasDataToMigrate) {
        console.log("[Migration] No legacy data found. Marking migration as complete.");
        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
        return;
    }

    console.log("[Migration] Found legacy data. Attempting to migrate to Firestore...", migrationPayload);
    toast({
      title: "Migrating Your Data",
      description: "We're moving your existing data to our new server. Please wait...",
      duration: 10000,
    });

    try {
        const idToken = await user.getIdToken(true);
        const response = await fetch('/api/migrate-local-storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify(migrationPayload),
        });

        const result = await response.json();

        if (response.ok) {
            toast({
                title: "Data Migration Successful!",
                description: result.message || "Your data has been securely moved to the server.",
            });
            localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
            // Optional: You could clear old localStorage keys here after a successful migration.
            // For safety during this transition, we will leave the old data for now.
        } else {
            throw new Error(result.error || 'Unknown migration error');
        }
    } catch (error: any) {
        console.error("[Migration] Data migration failed:", error);
        toast({
            title: "Data Migration Failed",
            description: `There was an issue: ${error.message}. Your data is safe in your browser. Please try refreshing or contact support.`,
            variant: "destructive",
            duration: 15000,
        });
    }
}
// --- END MIGRATION LOGIC ---


export function AppShell({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { toast } = useToast();
  const [migrationTriggered, setMigrationTriggered] = useState(false);

  useEffect(() => {
    // This effect runs once when the component mounts and sets up the listener.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        // This callback runs whenever the auth state changes.
        if (user && !migrationTriggered) {
            setMigrationTriggered(true); // Prevents re-running the migration for this session
            performMigration(user, toast);
        }
    });
    return () => unsubscribe(); // Cleanup the listener when the component unmounts
  }, [toast, migrationTriggered]); // Dependency array ensures this effect runs correctly

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {apiKey ? (
          <APIProvider 
            apiKey={apiKey} 
            solutionChannel="GMP_visgl_rgm_reactfirebase_v1"
            libraries={['places', 'routes']}
          >
            {children}
          </APIProvider>
        ) : (
          children 
        )}
      </main>
      <BottomNavigation />
    </div>
  );
}
