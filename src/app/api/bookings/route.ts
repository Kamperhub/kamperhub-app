// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore } from '@/lib/firebase-admin';
import type { BookingEntry } from '@/types/booking';
import { z, ZodError } from 'zod';

// Helper for user verification
async function verifyUser(req: NextRequest): Promise<{ uid: string; error?: NextResponse }> {
  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { uid: '', error: NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 }) };
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', error);
    return { uid: '', error: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message }, { status: 401 }) };
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
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const bookingsSnapshot = await adminFirestore.collection('users').doc(uid).collection('bookings').get();
    const bookings = bookingsSnapshot.docs.map(doc => ({ ...doc.data() })) as BookingEntry[];
    return NextResponse.json(bookings, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching bookings:', err);
    return NextResponse.json({ error: 'Failed to fetch bookings.', details: err.message }, { status: 500 });
  }
}

// POST a new booking for the authenticated user
export async function POST(req: NextRequest) {
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const parsedData = createBookingSchema.parse(body);

    const newBookingRef = adminFirestore.collection('users').doc(uid).collection('bookings').doc();
    const newBooking: BookingEntry = {
      id: newBookingRef.id,
      timestamp: new Date().toISOString(),
      ...parsedData,
    };
    
    await newBookingRef.set(newBooking);
    
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
  const { uid, error } = await verifyUser(req);
  if (error) return error;
  
  try {
    const body = await req.json();
    const parsedData = updateBookingSchema.parse(body);

    const bookingRef = adminFirestore.collection('users').doc(uid).collection('bookings').doc(parsedData.id);
    
    const updatedBooking = {
        ...parsedData,
        updatedAt: new Date().toISOString(), // Add an updated timestamp
    };
    
    await bookingRef.set(updatedBooking, { merge: true });
    
    return NextResponse.json({ message: 'Booking updated successfully.', booking: updatedBooking }, { status: 200 });
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
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Booking ID is required for deletion.' }, { status: 400 });
    }
    
    await adminFirestore.collection('users').doc(uid).collection('bookings').doc(id).delete();
    
    return NextResponse.json({ message: 'Booking deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting booking:', err);
    return NextResponse.json({ error: 'Failed to delete booking.', details: err.message }, { status: 500 });
  }
}
