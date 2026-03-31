import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const db = await getDatabase();
        
        // Fetch aggregated session data for the Work History view
        const sessions = await db
            .collection('sessions')
            .find({})
            .sort({ last_seen: -1 })
            .limit(100)
            .toArray();

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Sessions API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
