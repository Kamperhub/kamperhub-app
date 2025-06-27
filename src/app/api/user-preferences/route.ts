
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log("User Preferences API route hit");
  return NextResponse.json({ message: 'User Preferences API is working.' }, { status: 200 });
}
