// This API route is obsolete and has been removed as part of a refactor.
// WDH data is now managed as a nested object within the caravan entity.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ error: 'This endpoint is obsolete.' }, { status: 410 });
}
export async function POST() {
    return NextResponse.json({ error: 'This endpoint is obsolete.' }, { status: 410 });
}
export async function PUT() {
    return NextResponse.json({ error: 'This endpoint is obsolete.' }, { status: 410 });
}
export async function DELETE() {
    return NextResponse.json({ error: 'This endpoint is obsolete.' }, { status: 410 });
}
