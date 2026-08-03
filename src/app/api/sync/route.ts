
import { NextRequest, NextResponse } from 'next/server';
import { fetchBerlinData } from '@/lib/scraper';
import { processFiles } from '@/lib/parser';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
    if (!env.SYNC_SECRET) {
        return NextResponse.json({ message: 'Sync endpoint is not configured' }, { status: 503 });
    }

    const providedSecret = request.headers.get('x-sync-secret') ?? new URL(request.url).searchParams.get('secret');
    if (providedSecret !== env.SYNC_SECRET) {
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
            return NextResponse.json({
                message: 'Data synchronization failed',
                error: result.error
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            message: 'Internal Server Error',
            error: String(error)
        }, { status: 500 });
    }
}
