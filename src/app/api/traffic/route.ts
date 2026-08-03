import { NextRequest, NextResponse } from 'next/server';
import { getSnapshotBBoxString } from '@/lib/traffic';
import { env } from '@/lib/env';

const TELRAAM_API_URL = 'https://telraam-api.net/v1';

const CACHE_TTL_MS = 300; // 5 minutes in Next.js revalidate value

type TrafficApiErrorCode = 'API_RATE_LIMIT' | 'AUTH_ERROR' | 'API_ERROR';

class TrafficApiError extends Error {
    constructor(public code: TrafficApiErrorCode, message?: string) {
        super(message ?? code);
        this.name = 'TrafficApiError';
    }
}

async function fetchTrafficSnapshot(area: string, timeOffsetHours: number) {
    // Format time as YYYY-MM-DD HH:MM:00 (UTC)
    const date = new Date();
    date.setHours(date.getHours() - timeOffsetHours);
    date.setMinutes(0, 0, 0); // Align to start of the hour
    const timeString = date.toISOString().replace('T', ' ').substring(0, 19);

    const response = await fetch(`${TELRAAM_API_URL}/reports/traffic_snapshot`, {
        method: 'POST',
        headers: {
            'X-Api-Key': env.TELRAAM_API_KEY || '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            area: area,
            time: timeString,
            contents: "full"
        }),
        next: { revalidate: CACHE_TTL_MS }
    });

    if (response.status === 429) {
        throw new TrafficApiError('API_RATE_LIMIT');
    }

    if (response.status === 401 || response.status === 403) {
        throw new TrafficApiError('AUTH_ERROR');
    }

    if (!response.ok) {
        throw new TrafficApiError('API_ERROR', `API_ERROR_${response.status}`);
    }

    return await response.json();
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || 'Berlin';

    // No in-memory cache checks; handled by Next.js edge caching automatically

    try {
        const area = getSnapshotBBoxString(district);
        let data = null;

        // Try T-1 hour first
        try {
            data = await fetchTrafficSnapshot(area, 1);
        } catch (error) {
            if (error instanceof TrafficApiError && error.code === 'AUTH_ERROR') {
                return NextResponse.json({ error: 'API Key missing or invalid' }, { status: 401 });
            }
            if (error instanceof TrafficApiError && error.code === 'API_RATE_LIMIT') {
                return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
            }
            console.error('T-1 fetch failed:', error);
        }

        // If T-1 returned no features or failed, try T-2
        if (!data || !data.features || data.features.length === 0) {
            try {
                const dataT2 = await fetchTrafficSnapshot(area, 2);
                if (dataT2 && dataT2.features && dataT2.features.length > 0) {
                    data = dataT2;
                }
            } catch (error) {
                if (error instanceof TrafficApiError && error.code === 'API_RATE_LIMIT') {
                    if (data) return NextResponse.json(data); // Return T-1 empty result if T-2 rate limits
                    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
                }
                console.error('T-2 fetch failed:', error);
            }
        }

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch traffic data' }, { status: 500 });
        }


        return NextResponse.json(data);

    } catch (error) {
        console.error('Traffic API Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to fetch traffic data'
        }, { status: 500 });
    }
}
