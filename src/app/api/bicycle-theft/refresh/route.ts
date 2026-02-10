import { NextResponse } from 'next/server';
import { fetchBicycleTheftData, fetchCarTheftData } from '@/lib/scraper';

export async function POST() {
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
            error: error instanceof Error ? error.message : 'Unknown error during data refresh'
        }, { status: 500 });
    }
}
