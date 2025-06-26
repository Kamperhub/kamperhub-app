
// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore, firebaseAdminInitError } from '@/lib/firebase-admin';
import type { BookingEntry } from '@/types/booking';
import type { LoggedTrip } from '@/types/tripplanner';
import { z, ZodError } from 'zod';

const ACCOMMODATION_CATEGORY_NAME = "Accommodation";

async function verifyUserAndSDK(req: NextRequest): Promise<{ uid?: string; errorResponse?: NextResponse }> {
  if (firebaseAdminInitError || !adminFirestore || !admin.auth()) {
    console.error('API Route Error: Firebase Admin SDK not available.', firebaseAdminInitError);
    return {
      errorResponse: NextResponse.json({
        error: 'Server configuration error: The connection to the database or authentication service is not available. Please check server logs for details about GOOGLE_APPLICATION_CREDENTIALS_JSON.',
        details: firebaseAdminInitError?.message || "Firebase Admin SDK services are not initialized."
      }, { status: 503 })
    };
  }
  
  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { errorResponse: NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 }) };
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', { message: error.message, code: error.code });
    return { errorResponse: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message, errorCode: error.code }, { status: 401 }) };
  }
}

// Zod schemas for validation
const createBookingSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  locationAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  contactWebsite: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  confirmationNumber: z.string().optional(),
  checkInDate: z.string().datetime({ message: "Check-in date must be a valid ISO date string" }),
  checkOutDate: z.string().datetime({ message: "Check-out date must be a valid ISO date string" }),
  notes: z.string().optional(),
  assignedTripId: z.string().nullable().optional(),
  budgetedCost: z.coerce.number().min(0, "Budgeted cost must be non-negative").optional().nullable(),
}).refine(data => new Date(data.checkOutDate) >= new Date(data.checkInDate), {
    message: "Check-out date must be on or after check-in date",
    path: ["checkOutDate"],
});

const updateBookingSchema = createBookingSchema.extend({
  id: z.string().min(1, "Booking ID is required for updates"),
  timestamp: z.string().datetime(),
});

// GET all bookings for the authenticated user
export async function GET(req: NextRequest) {
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;

  try {
    const bookingsSnapshot = await adminFirestore!.collection('users').doc(uid!).collection('bookings').get();
    const bookings = bookingsSnapshot.docs.map(doc => ({ ...doc.data() })) as BookingEntry[];
    return NextResponse.json(bookings, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching bookings:', err);
    return NextResponse.json({ error: 'Failed to fetch bookings.', details: err.message }, { status: 500 });
  }
}

// POST a new booking for the authenticated user
export async function POST(req: NextRequest) {
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsedData = createBookingSchema.parse(body);
    const { assignedTripId, budgetedCost, ...bookingDetails } = parsedData;

    const newBookingRef = adminFirestore!.collection('users').doc(uid!).collection('bookings').doc();
    const newBooking: BookingEntry = {
      id: newBookingRef.id,
      timestamp: new Date().toISOString(),
      assignedTripId: assignedTripId || null,
      budgetedCost: budgetedCost || null,
      ...bookingDetails,
    };
    
    // If assigned to a trip with a cost, update the trip's budget in a transaction
    if (assignedTripId && budgetedCost && budgetedCost > 0) {
        const tripRef = adminFirestore!.collection('users').doc(uid!).collection('trips').doc(assignedTripId);
        await adminFirestore!.runTransaction(async (transaction) => {
            const tripDoc = await transaction.get(tripRef);
            if (!tripDoc.exists) throw new Error("Assigned trip not found.");
            
            const tripData = tripDoc.data() as LoggedTrip;
            const budget = tripData.budget || [];
            const accommodationCategoryIndex = budget.findIndex(cat => cat.name === ACCOMMODATION_CATEGORY_NAME);

            if (accommodationCategoryIndex > -1) {
                budget[accommodationCategoryIndex].budgetedAmount += budgetedCost;
            } else {
                budget.push({
                    id: 'accommodation_budget_category',
                    name: ACCOMMODATION_CATEGORY_NAME,
                    budgetedAmount: budgetedCost,
                });
            }
            transaction.update(tripRef, { budget });
            transaction.set(newBookingRef, newBooking);
        });
    } else {
        await newBookingRef.set(newBooking);
    }
    
    return NextResponse.json(newBooking, { status: 201 });

  } catch (err: any) {
    console.error('Error creating booking:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid booking data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create booking.', details: err.message }, { status: 500 });
  }
}

// PUT (update) an existing booking for the authenticated user
export async function PUT(req: NextRequest) {
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;
  
  try {
    const body = await req.json();
    const newBookingData = updateBookingSchema.parse(body);
    const { id: bookingId, assignedTripId: newTripId, budgetedCost: newCostValue } = newBookingData;
    const newCost = newCostValue || 0;

    const bookingRef = adminFirestore!.collection('users').doc(uid!).collection('bookings').doc(bookingId);

    await adminFirestore!.runTransaction(async (transaction) => {
      const bookingDoc = await transaction.get(bookingRef);
      if (!bookingDoc.exists) throw new Error("Booking not found.");
      
      const oldBookingData = bookingDoc.data() as BookingEntry;
      const oldTripId = oldBookingData.assignedTripId;
      const oldCost = oldBookingData.budgetedCost || 0;
      
      // 1. Revert old cost from old trip budget
      if (oldTripId && oldCost > 0) {
        const oldTripRef = adminFirestore!.collection('users').doc(uid!).collection('trips').doc(oldTripId);
        const oldTripDoc = await transaction.get(oldTripRef);
        if (oldTripDoc.exists) {
          const tripData = oldTripDoc.data() as LoggedTrip;
          const budget = (tripData.budget || []).map(cat => {
            if (cat.name === ACCOMMODATION_CATEGORY_NAME) {
              return { ...cat, budgetedAmount: Math.max(0, cat.budgetedAmount - oldCost) };
            }
            return cat;
          }).filter(cat => !(cat.name === ACCOMMODATION_CATEGORY_NAME && cat.budgetedAmount <= 0));
          transaction.update(oldTripRef, { budget });
        }
      }
      
      // 2. Apply new cost to new trip budget
      if (newTripId && newCost > 0) {
        const newTripRef = adminFirestore!.collection('users').doc(uid!).collection('trips').doc(newTripId);
        const newTripDoc = await transaction.get(newTripRef);
        if (!newTripDoc.exists) throw new Error("New assigned trip not found.");
        
        const tripData = newTripDoc.data() as LoggedTrip;
        const budget = tripData.budget || [];
        const accommodationCategoryIndex = budget.findIndex(cat => cat.name === ACCOMMODATION_CATEGORY_NAME);
        
        if (accommodationCategoryIndex > -1) {
          budget[accommodationCategoryIndex].budgetedAmount += newCost;
        } else {
          budget.push({ id: 'accommodation_budget_category', name: ACCOMMODATION_CATEGORY_NAME, budgetedAmount: newCost });
        }
        transaction.update(newTripRef, { budget });
      }

      // 3. Update the booking document itself
      const updatedBookingData = { ...newBookingData, updatedAt: new Date().toISOString() };
      transaction.set(bookingRef, updatedBookingData, { merge: true });
    });
    
    return NextResponse.json({ message: 'Booking updated successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating booking:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid booking data for update.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update booking.', details: err.message }, { status: 500 });
  }
}

// DELETE a booking for the authenticated user
export async function DELETE(req: NextRequest) {
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Booking ID is required for deletion.' }, { status: 400 });
    }
    
    const bookingRef = adminFirestore!.collection('users').doc(uid!).collection('bookings').doc(id);
    
    await adminFirestore!.runTransaction(async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists) throw new Error("Booking to delete not found.");

        const bookingData = bookingDoc.data() as BookingEntry;
        const { assignedTripId, budgetedCost } = bookingData;

        if (assignedTripId && budgetedCost && budgetedCost > 0) {
            const tripRef = adminFirestore!.collection('users').doc(uid!).collection('trips').doc(assignedTripId);
            const tripDoc = await transaction.get(tripRef);
            if (tripDoc.exists) {
                const tripData = tripDoc.data() as LoggedTrip;
                const budget = (tripData.budget || []).map(cat => {
                    if (cat.name === ACCOMMODATION_CATEGORY_NAME) {
                        return { ...cat, budgetedAmount: Math.max(0, cat.budgetedAmount - budgetedCost) };
                    }
                    return cat;
                }).filter(cat => !(cat.name === ACCOMMODATION_CATEGORY_NAME && cat.budgetedAmount <= 0));
                transaction.update(tripRef, { budget });
            }
        }
        transaction.delete(bookingRef);
    });

    return NextResponse.json({ message: 'Booking deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting booking:', err);
    return NextResponse.json({ error: 'Failed to delete booking.', details: err.message }, { status: 500 });
  }
}
