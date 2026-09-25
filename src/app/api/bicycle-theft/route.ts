import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { DISTRICT_TO_LOR_PREFIX } from '@/lib/constants';
import { fetchLiveTheftData } from '@/lib/theft';
import { mapTheftRows, type LorCentroid, type TheftPoint } from '@/lib/theft-mapping';

let lorCentroidsCache: Record<string, LorCentroid> | null = null;

function loadLorCentroids(): Record<string, LorCentroid> {
    if (lorCentroidsCache) return lorCentroidsCache;
    const lorPath = path.join(process.cwd(), 'src', 'lib', 'lor-centroids.json');
    if (!fs.existsSync(lorPath)) throw new Error(`LOR centroids file not found at ${lorPath}`);
    const lorText = fs.readFileSync(lorPath, 'utf-8');
    lorCentroidsCache = JSON.parse(lorText);
    return lorCentroidsCache!;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('start');
    const endDateStr = searchParams.get('end');
    const district = searchParams.get('district');
    const type = searchParams.get('type') || 'bicycle'; // bicycle, car, both

    if (startDateStr && isNaN(new Date(startDateStr).getTime())) {
        return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }
    if (endDateStr && isNaN(new Date(endDateStr).getTime())) {
        return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
    }

    try {
        const lorCentroids = loadLorCentroids();

        const getMappedData = async (theftType: 'bicycle' | 'car') => {
            const rawData = await fetchLiveTheftData(theftType);

            return mapTheftRows(rawData, theftType, lorCentroids);
        };

        let allData: TheftPoint[] = [];
        if (type === 'bicycle' || type === 'both') {
            allData = [...allData, ...await getMappedData('bicycle')];
        }
        if (type === 'car' || type === 'both') {
            allData = [...allData, ...await getMappedData('car')];
        }

        const startDate = startDateStr ? new Date(startDateStr) : new Date(0);
        const endDate = endDateStr ? new Date(endDateStr) : new Date();
        endDate.setHours(23, 59, 59, 999);

        const filteredData = allData.filter(item => {
            const itemDate = new Date(item.date);
            const inDateRange = itemDate >= startDate && itemDate <= endDate;
            if (!inDateRange) return false;

            if (district && district !== 'Berlin' && district !== 'All') {
                const prefix = DISTRICT_TO_LOR_PREFIX[district];
                if (prefix && item.rawLor) {
                    return item.rawLor.startsWith(prefix);
                }
                return item.lor === district;
            }
            return true;
        });

        return NextResponse.json(filteredData, {
            headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
        });

    } catch (error) {
        console.error('Error reading/parsing theft data:', error);
        return NextResponse.json({ error: 'Failed to load theft data' }, { status: 500 });
    }
}
