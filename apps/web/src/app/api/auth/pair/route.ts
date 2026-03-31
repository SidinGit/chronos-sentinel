import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const PAIRING_PREFIX = 'pairing:';

/**
 * POST /api/auth/pair
 *
 * Called by the web dashboard when a user enters the 6-digit code
 * displayed on their desktop agent. This endpoint:
 *
 * 1. Scans all pending pairing keys in Redis
 * 2. Finds the one matching the submitted code
 * 3. Updates the pairing state with IsPaired=true and a generated API key
 * 4. The desktop agent's next CheckPairingStatus poll picks up the result
 *
 * Flow:  Agent → InitiatePairing → Redis(code)
 *        User  → Web Dashboard → This Endpoint → Redis(paired=true)
 *        Agent → CheckPairingStatus → Redis(reads API key) → Done
 */
export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code || code.length !== 6) {
            return NextResponse.json(
                { success: false, error: 'Invalid code format' },
                { status: 400 }
            );
        }

        // Scan for the pairing key matching this code
        const keys = await redis.keys(`${PAIRING_PREFIX}*`);

        for (const key of keys) {
            const raw = await redis.get(key);
            if (!raw) continue;

            const state = JSON.parse(raw);

            if (state.user_code === code && !state.is_paired) {
                // Match found — generate API key and mark as paired
                const apiKey = generateApiKey();
                const hardwareId = key.replace(PAIRING_PREFIX, '');

                const updatedState = {
                    ...state,
                    is_paired: true,
                    api_key: apiKey,
                };

                // Write back with remaining TTL
                const ttl = await redis.ttl(key);
                if (ttl > 0) {
                    await redis.set(key, JSON.stringify(updatedState), 'EX', ttl);
                } else {
                    await redis.set(key, JSON.stringify(updatedState), 'EX', 300);
                }

                return NextResponse.json({
                    success: true,
                    deviceName: hardwareId,
                });
            }
        }

        return NextResponse.json(
            { success: false, error: 'Invalid or expired code' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Pairing error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Generates a random API key for device authentication.
 * Format: cs_<32 random hex chars>
 */
function generateApiKey(): string {
    const chars = 'abcdef0123456789';
    let key = 'cs_';
    for (let i = 0; i < 32; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
}