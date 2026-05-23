import { NextResponse } from 'next/server';
import { getDevicesCollection } from '@/lib/mongodb';

/**
 * POST /api/generate — Provision new devices
 * Body: { count: number (1–50) }
 */
export async function POST(request) {
    const body = await request.json();
    const count = parseInt(body.count) || 1;

    if (count < 1 || count > 50) {
        return NextResponse.json({ error: 'Count must be between 1 and 50' }, { status: 400 });
    }

    const col = await getDevicesCollection();
    const tokens = [];
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    for (let i = 0; i < count; i++) {
        let token = '';
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
            attempts++;
            let seg1 = '';
            let seg2 = '';
            for (let j = 0; j < 4; j++) {
                seg1 += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                seg2 += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            }
            const testToken = `OBD-${seg1}-${seg2}`;
            const exists = await col.findOne({ device_token: testToken });
            if (!exists) {
                token = testToken;
                break;
            }
        }

        if (!token) {
            return NextResponse.json(
                { error: `Failed to generate unique token after ${maxAttempts} attempts` },
                { status: 500 }
            );
        }

        await col.insertOne({
            device_token: token,
            vin: null,
            owner_id: null,
            status: 'manufactured',
            created_at: new Date(),
            registered_at: null,
            paired_at: null,
        });

        tokens.push(token);
    }

    return NextResponse.json({ generated: tokens.length, tokens });
}
