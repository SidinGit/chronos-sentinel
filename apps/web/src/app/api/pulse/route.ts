import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const PULSE_PREFIX = 'pulse:';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Scan for all active pulse keys
        const keys = await redis.keys(`${PULSE_PREFIX}*`);
        
        if (keys.length === 0) {
            return NextResponse.json({ pulses: [] });
        }

        const rawPulses = await redis.mget(keys);
        const pulses = rawPulses
            .map((raw) => (raw ? JSON.parse(raw) : null))
            .filter((p) => p !== null);

        return NextResponse.json({ pulses });
    } catch (error) {
        console.error('Pulse API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch pulse data' }, { status: 500 });
    }
}
