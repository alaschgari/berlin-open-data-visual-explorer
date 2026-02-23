import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';

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
            const filePath = path.join(process.cwd(), 'data/processed', 'business_search_index.json.gz');
            if (fs.existsSync(filePath)) {
                const compressedContent = fs.readFileSync(filePath);
                const fileContent = zlib.gunzipSync(compressedContent).toString('utf8');
                cachedSearchIndex = JSON.parse(fileContent);
                isCacheLoaded = true;
            } else {
                return NextResponse.json({ error: 'Search index not found' }, { status: 500 });
            }
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
        console.error('Error reading business search data:', error);
        return NextResponse.json({ error: 'Failed to search business data' }, { status: 500 });
    }
}
