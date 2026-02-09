
import { NextResponse } from 'next/server';
import { fetchBerlinData } from '@/lib/scraper';
import { processFiles } from '@/lib/parser';

export async function GET() {
    try {
        const result = await fetchBerlinData();

        if (result.success) {
            const records = await processFiles();
            return NextResponse.json({
                message: 'Data synchronization and processing successful',
                downloadCount: result.count,
                processedCount: records.length
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
