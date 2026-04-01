import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { redis } from '@/lib/redis';

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const deviceId = params.id;
        
        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
        }

        const db = await getDatabase();
        
        // 1. Add to revoked_devices MongoDB collection
        await db.collection('revoked_devices').updateOne(
            { device_id: deviceId },
            { 
                $set: { 
                    device_id: deviceId,
                    revoked_at: Date.now() 
                } 
            },
            { upsert: true } // Creates if it doesn't exist
        );

        // 2. Set the Redis blocklist flag so Go Ingestor instantly drops payloads
        await redis.set(`revoked:${deviceId}`, 'true');

        // 3. Clear any active pulse and live feed cache for immediate dashboard feedback
        await redis.del(`pulse:${deviceId}`);
        await redis.del(`feed:${deviceId}`);

        return NextResponse.json({ success: true, message: 'Device securely revoked.' });
        
    } catch (error) {
        console.error('Revoke Device API Error:', error);
        return NextResponse.json({ error: 'Failed to revoke device' }, { status: 500 });
    }
}
