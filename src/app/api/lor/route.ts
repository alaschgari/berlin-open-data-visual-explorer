import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
    try {
        // Try to load the reprojected file first, fall back to original (though original is likely wrong projection)
        const possiblePaths = [
            path.join(process.cwd(), 'data', 'raw', 'lor_planungsraeume_2021_wgs84.geojson'),
            path.join(process.cwd(), 'data', 'raw', 'lor_planungsraeume_2021.geojson')
        ];

        let fileContents = null;
        for (const p of possiblePaths) {
            try {
                fileContents = await fs.readFile(p, 'utf8');
                break;
            } catch (e) {
                continue;
            }
        }

        if (!fileContents) {
            throw new Error('No GeoJSON file found');
        }

        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading GeoJSON:', error);
        return NextResponse.json({ error: 'Failed to load LOR data' }, { status: 500 });
    }
}
