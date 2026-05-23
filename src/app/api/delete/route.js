import { NextResponse } from 'next/server';
import { getDevicesCollection } from '@/lib/mongodb';

/**
 * DELETE /api/delete — Delete a device
 * Query param: token
 */
export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
    }

    const targetToken = token.trim().toUpperCase();
    const col = await getDevicesCollection();
    const device = await col.findOne({ device_token: targetToken });

    if (!device) {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    if (device.status === 'paired') {
        return NextResponse.json({ error: 'Cannot delete a paired device. Unpair it first.' }, { status: 400 });
    }

    await col.deleteOne({ device_token: targetToken });

    return NextResponse.json({ status: 'deleted', token: targetToken });
}
