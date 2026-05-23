import { NextResponse } from 'next/server';
import { getDevicesCollection } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats — Dashboard statistics
 */
export async function GET() {
    const col = await getDevicesCollection();

    const [total, manufactured, registered, paired] = await Promise.all([
        col.countDocuments({}),
        col.countDocuments({ status: 'manufactured' }),
        col.countDocuments({ status: 'registered' }),
        col.countDocuments({ status: 'paired' }),
    ]);

    return NextResponse.json({ total, manufactured, registered, paired });
}
