import { NextResponse } from 'next/server';
import { getDevicesCollection } from '@/lib/mongodb';

/**
 * GET /api/devices — List / search devices
 * Query params: status, search
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter = {};

    if (status && status !== 'all') {
        filter.status = status;
    }

    if (search) {
        const query = search.trim();
        filter.$or = [
            { device_token: { $regex: query, $options: 'i' } },
            { vin: { $regex: query, $options: 'i' } },
            { brand: { $regex: query, $options: 'i' } },
            { model: { $regex: query, $options: 'i' } },
            { year: { $regex: query, $options: 'i' } },
        ];
    }

    const col = await getDevicesCollection();
    const devices = await col.find(filter).sort({ created_at: -1 }).limit(200).toArray();

    return NextResponse.json({
        devices,
        count: devices.length,
    });
}
