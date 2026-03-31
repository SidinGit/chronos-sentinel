import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Find the active device from the pulse keys
        const keys = await redis.keys('pulse:*');
        
        if (keys.length === 0) {
            return NextResponse.json({ feed: [] });
        }

        // For now, assume single device for MVP. In product scale, 
        // we'd fetch the feed for the specific authenticated user's device.
        const deviceId = keys[0].replace('pulse:', '');
        const feedKey = `feed:${deviceId}`;

        // LRANGE fetches items from the Redis List (0 to 49 gets the latest 50)
        const entries = await redis.lrange(feedKey, 0, 49);
        
        const feed = entries.map((entry) => JSON.parse(entry));

        return NextResponse.json({ feed });
    } catch (error) {
        console.error('Feed API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch live feed' }, { status: 500 });
    }
}
