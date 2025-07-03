
// This file is intentionally left blank.
// The API endpoint for the "Service & Fuel Log" feature has been removed to restore application stability.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'This feature has been temporarily disabled.' }, { status: 404 });
}
export async function POST() {
  return NextResponse.json({ error: 'This feature has been temporarily disabled.' }, { status: 404 });
}
export async function PUT() {
  return NextResponse.json({ error: 'This feature has been temporarily disabled.' }, { status: 404 });
}
export async function DELETE() {
  return NextResponse.json({ error: 'This feature has been temporarily disabled.' }, { status: 404 });
}
