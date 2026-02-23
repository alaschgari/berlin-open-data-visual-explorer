import { NextResponse } from 'next/server';
import zlib from 'zlib';

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/alaschgari/berlin-open-data-visual-explorer/main/data/processed/business_aggregated.json.gz';

export async function GET() {
    try {
        const response = await fetch(GITHUB_RAW_URL, {
            next: { revalidate: 3600 } // Cache for 1 hour to prevent GitHub rate limits
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch from GitHub: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const compressedContent = Buffer.from(arrayBuffer);
        const fileContent = zlib.gunzipSync(compressedContent).toString('utf8');
        const data = JSON.parse(fileContent);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching business data from GitHub:', error);
        return NextResponse.json({ error: 'Failed to load business data' }, { status: 500 });
    }
}
