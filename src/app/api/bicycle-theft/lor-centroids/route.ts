import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const lorPath = path.join(process.cwd(), 'src', 'lib', 'lor-centroids.json');
        if (!fs.existsSync(lorPath)) {
            return NextResponse.json({ error: 'LOR centroids file not found' }, { status: 404 });
        }
        const lorText = fs.readFileSync(lorPath, 'utf-8');
        const lorCentroids = JSON.parse(lorText);

        return NextResponse.json(lorCentroids, {
            headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
        });
    } catch (error) {
        console.error('Error reading LOR centroids:', error);
        return NextResponse.json({ error: 'Failed to load LOR centroids' }, { status: 500 });
    }
}
