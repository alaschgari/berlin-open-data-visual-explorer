import { NextResponse } from 'next/server';
import zlib from 'zlib';

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/alaschgari/berlin-open-data-visual-explorer/main/data/processed/business_search_index.json.gz';

// Cache the search index in memory
let cachedSearchIndex: any[] | null = null;
let isCacheLoaded = false;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '500');
    const districtId = searchParams.get('districtId');

    if (!query) {
        return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    try {
        if (!isCacheLoaded) {
            const response = await fetch(GITHUB_RAW_URL, {
                next: { revalidate: 7776000 } // Cache for 3 months (90 days) since data rarely updates
            });

            if (!response.ok) {
                return NextResponse.json({ error: 'Search index not found on GitHub' }, { status: 500 });
            }

            const arrayBuffer = await response.arrayBuffer();
            const compressedContent = Buffer.from(arrayBuffer);
            const fileContent = zlib.gunzipSync(compressedContent).toString('utf8');
            cachedSearchIndex = JSON.parse(fileContent);
            isCacheLoaded = true;
        }

        const results: any[] = [];
        const lorCounts: Record<string, number> = {};
        const lowercaseQuery = query.toLowerCase();

        if (cachedSearchIndex) {
            for (const item of cachedSearchIndex) {
                const branch = (item.branch || '').toLowerCase();

                if (branch.includes(lowercaseQuery)) {
                    const lorId = item.lorId;
                    lorCounts[lorId] = (lorCounts[lorId] || 0) + 1;

                    const matchesDistrict = !districtId || (lorId && lorId.startsWith(districtId));

                    if (matchesDistrict && results.length < limit) {
                        results.push(item);
                    }
                }
            }
        }

        return NextResponse.json({
            points: results,
            lorCounts: lorCounts,
            totalMatched: Object.values(lorCounts).reduce((a, b) => a + b, 0)
        });
    } catch (error) {
        console.error('Error fetching business search data:', error);
        return NextResponse.json({ error: 'Failed to search business data' }, { status: 500 });
    }
}
