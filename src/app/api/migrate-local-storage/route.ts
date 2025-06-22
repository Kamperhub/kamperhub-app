// src/app/api/migrate-local-storage/route.ts

// This file is obsolete as the one-time data migration from localStorage
// to Firestore has been completed. It can be safely deleted from the project.
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ message: 'This migration endpoint is obsolete and no longer functional.' }, { status: 410 }); // 410 Gone
}
