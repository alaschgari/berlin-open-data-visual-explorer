import { NextResponse } from 'next/server';
import zlib from 'zlib';

const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/alaschgari/berlin-open-data-visual-explorer/main/data/processed/lor_details';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lorId = searchParams.get('lorId');

    if (!lorId) {
        return NextResponse.json({ error: 'lorId is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${GITHUB_RAW_BASE_URL}/${lorId}.json.gz`, {
            next: { revalidate: 7776000 } // Cache for 3 months (90 days) since data rarely updates
        });

        if (response.status === 404) {
            // It's possible a valid LOR just has no businesses, or the file wasn't generated. Return empty array.
            return NextResponse.json([]);
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch from GitHub: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const compressedContent = Buffer.from(arrayBuffer);
        const fileContent = zlib.gunzipSync(compressedContent).toString('utf8');
        const data = JSON.parse(fileContent);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching business details from GitHub:', error);
        return NextResponse.json({ error: 'Failed to load business details' }, { status: 500 });
    }
}
