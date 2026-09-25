import { NextResponse } from 'next/server';
import { fetchBicycleTheftData, fetchCarTheftData } from '@/lib/scraper';
import { checkSyncSecret } from '@/lib/auth';

export async function POST(request: Request) {
    const auth = checkSyncSecret(request);
    if (auth === 'unconfigured') {
        return NextResponse.json({ success: false, error: 'Refresh endpoint is not configured' }, { status: 503 });
    }
    if (auth === 'unauthorized') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('API Trigger: Updating vehicle theft data from official sources...');

    try {
        const [bikeSuccess, carSuccess] = await Promise.all([
            fetchBicycleTheftData(),
            fetchCarTheftData()
        ]);

        if (bikeSuccess && carSuccess) {
            return NextResponse.json({
                success: true,
                message: 'All vehicle theft data updated successfully'
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Failed to download some data from official sources',
                details: { bikeSuccess, carSuccess }
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in refresh-theft API:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal error during data refresh'
        }, { status: 500 });
    }
}
