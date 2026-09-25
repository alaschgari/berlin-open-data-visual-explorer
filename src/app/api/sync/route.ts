
import { NextRequest, NextResponse } from 'next/server';
import { fetchBerlinData } from '@/lib/scraper';
import { processFiles } from '@/lib/parser';
import { checkSyncSecret } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = checkSyncSecret(request);
    if (auth === 'unconfigured') {
        return NextResponse.json({ message: 'Sync endpoint is not configured' }, { status: 503 });
    }
    if (auth === 'unauthorized') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await fetchBerlinData();

        if (result.success) {
            const records = await processFiles();
            return NextResponse.json({
                message: 'Data synchronization and processing successful',
                downloadCount: result.count,
                processedCount: (records.financialRecords?.length || 0) + (records.subsidyRecords?.length || 0)
            });
        } else {
            console.error('[API Sync] Sync failed:', result.error);
            return NextResponse.json({
                message: 'Data synchronization failed'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('[API Sync] Error:', error);
        return NextResponse.json({
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}
