import { NextResponse } from 'next/server';
import { getBadestellenLive, BadestelleFeature } from '@/lib/badestellen';

export const dynamic = 'force-dynamic';

// Server-side in-memory cache (shared across all users)
let cachedData: BadestelleFeature[] | null = null;
let cachedAt: number | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const now = Date.now();
    const cacheAge = cachedAt ? now - cachedAt : Infinity;
    const isCacheValid = cachedData && cacheAge < CACHE_TTL_MS;

    try {
        // Serve cached data unless refresh is requested AND cooldown expired
        if (isCacheValid && !forceRefresh) {
            return NextResponse.json({
                data: cachedData,
                lastUpdated: cachedAt,
                cooldownRemaining: Math.max(0, CACHE_TTL_MS - cacheAge),
                fromCache: true
            });
        }

        // Refresh requested but cooldown hasn't expired yet
        if (forceRefresh && isCacheValid) {
            return NextResponse.json({
                data: cachedData,
                lastUpdated: cachedAt,
                cooldownRemaining: Math.max(0, CACHE_TTL_MS - cacheAge),
                fromCache: true,
                cooldownActive: true
            });
        }

        // Fetch fresh data from LAGeSo
        const data = await getBadestellenLive();
        cachedData = data;
        cachedAt = Date.now();

        return NextResponse.json({
            data,
            lastUpdated: cachedAt,
            cooldownRemaining: CACHE_TTL_MS,
            fromCache: false
        });
    } catch (error) {
        console.error('Badestellen API Route Error:', error);

        // If fetch fails but we have cached data, serve stale
        if (cachedData) {
            return NextResponse.json({
                data: cachedData,
                lastUpdated: cachedAt,
                cooldownRemaining: 0,
                fromCache: true,
                stale: true
            });
        }

        return NextResponse.json({ error: 'Failed to fetch badestellen data' }, { status: 500 });
    }
}
