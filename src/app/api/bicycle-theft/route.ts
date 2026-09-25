import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { DISTRICT_TO_LOR_PREFIX } from '@/lib/constants';
import { fetchLiveTheftData } from '@/lib/theft';

// Interfaces and types are now imported from @/lib/theft where appropriate
// or handled dynamically.

interface TheftPoint {
    id: string;
    category: 'bicycle' | 'car';
    lat: number;
    lng: number;
    amount: number;
    date: string;
    hour: number;
    registeredDate: string | null;
    type: string | undefined;
    lor: string;
    rawLor: string;
    details: string | undefined;
}

interface LorCentroid {
    lat: number;
    lng: number;
    name: string;
}

function addJitter(lat: number, lng: number, radiusDeg: number = 0.002) {
    const r = radiusDeg * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    return {
        lat: lat + r * Math.cos(theta),
        lng: lng + r * Math.sin(theta) * 1.5
    };
}

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
            const isBike = theftType === 'bicycle';
            const rawData = await fetchLiveTheftData(theftType);

            return rawData.reduce((acc: TheftPoint[], record, index) => {
                if (!record.TATZEIT_ANFANG_DATUM || !record.LOR) return acc;

                const dateParts = record.TATZEIT_ANFANG_DATUM.split('.');
                if (dateParts.length !== 3) return acc;
                const theftDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                if (isNaN(theftDate.getTime())) return acc;

                const lor = record.LOR;
                const lorData = lorCentroids[lor];
                if (lorData) {
                    const coords = addJitter(lorData.lat, lorData.lng, 0.003);

                    // Parse registered date
                    const regDateParts = (record.ANGELEGT_AM || '').split('.');
                    const registeredDate = regDateParts.length === 3
                        ? `${regDateParts[2]}-${regDateParts[1]}-${regDateParts[0]}`
                        : null;

                    acc.push({
                        id: `${theftType}-${index}-${lor}`,
                        category: theftType,
                        lat: coords.lat,
                        lng: coords.lng,
                        amount: parseInt(record.SCHADENSHOEHE ?? '') || 0,
                        date: theftDate.toISOString(),
                        hour: parseInt((record.TATZEIT_ANFANG_STUNDE || '0').split(':')[0]) || 0,
                        registeredDate,
                        type: isBike ? record.ART_DES_FAHRRADS : (record.ERLANGTES_GUT || 'KFZ'),
                        lor: lorData.name,
                        rawLor: lor,
                        details: isBike ? record.DELIKT : (record.EINDRINGEN_IN_KFZ || record.DELIKT)
                    });
                }
                return acc;
            }, []);
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
