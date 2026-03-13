import { NextResponse } from 'next/server';
import { getBaustellenLive } from '@/lib/baustellen';

export async function GET() {
    try {
        const data = await getBaustellenLive();
        
        return NextResponse.json(data, {
            headers: { 
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                'Access-Control-Allow-Origin': '*'
            },
        });
    } catch (error) {
        console.error('API Error (Baustellen):', error);
        return NextResponse.json({ error: 'Failed to fetch construction data' }, { status: 500 });
    }
}
