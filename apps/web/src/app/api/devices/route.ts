import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { redis } from '@/lib/redis';

const PULSE_PREFIX = 'pulse:';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const db = await getDatabase();
        
        // Find all unique devices that have ever sent a session
        const deviceIds = await db.collection('sessions').distinct('device_id');
        
        // Check which ones are currently online via Redis
        const activeKeys = await redis.keys(`${PULSE_PREFIX}*`);
        const onlineIds = activeKeys.map((k) => k.replace(PULSE_PREFIX, ''));

        const devices = deviceIds.map((id: string) => ({
            id,
            name: id, // In a real app we'd join with a `devices` collection for friendly names
            isOnline: onlineIds.includes(id),
            lastSeen: onlineIds.includes(id) ? Date.now() : null, // Would query latest session end_time if offline
        }));

        return NextResponse.json({ devices });
    } catch (error) {
        console.error('Devices API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }
}
