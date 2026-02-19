import { NextResponse } from 'next/server';
import { getBadestellenLive } from '@/lib/badestellen';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await getBadestellenLive();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Badestellen API Route Error:', error);
        return NextResponse.json({ error: 'Failed to fetch badestellen data' }, { status: 500 });
    }
}
