// src/app/api/ping/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Defaults to auto
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "pong" });
}
