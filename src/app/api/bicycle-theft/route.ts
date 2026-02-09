import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

interface TheftRecord {
    ANGELEGT_AM: string;
    TATZEIT_ANFANG_DATUM: string;
    TATZEIT_ANFANG_STUNDE: string;
    TATZEIT_ENDE_DATUM: string;
    TATZEIT_ENDE_STUNDE: string;
    LOR: string;
    SCHADENSHOEHE: string;
    VERSUCH: string;
    ART_DES_FAHRRADS: string;
    DELIKT: string;
    ERFASSUNGSGRUND: string;
}

interface LorCentroid {
    lat: number;
    lng: number;
    name: string;
}

const DISTRICT_TO_LOR_PREFIX: Record<string, string> = {
    'Mitte': '01',
    'Friedrichshain-Kreuzberg': '02',
    'Pankow': '03',
    'Charlottenburg-Wilmersdorf': '04',
    'Spandau': '05',
    'Steglitz-Zehlendorf': '06',
    'Tempelhof-Schöneberg': '07',
    'Neukölln': '08',
    'Treptow-Köpenick': '09',
    'Marzahn-Hellersdorf': '10',
    'Lichtenberg': '11',
    'Reinickendorf': '12'
};

function addJitter(lat: number, lng: number, radiusDeg: number = 0.002) {
    const r = radiusDeg * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    return {
        lat: lat + r * Math.cos(theta),
        lng: lng + r * Math.sin(theta) * 1.5
    };
}

const globalForCache = global as unknown as { bicycleTheftCache: any[] | null };

if (globalForCache.bicycleTheftCache === undefined) {
    globalForCache.bicycleTheftCache = null;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('start');
    const endDateStr = searchParams.get('end');
    const district = searchParams.get('district');

    try {
        let mappedData: any[] = [];

        if (globalForCache.bicycleTheftCache) {
            mappedData = globalForCache.bicycleTheftCache;
        } else {
            console.log('Reading bicycle theft data from local CSV...');

            const csvPath = path.join(process.cwd(), 'data', 'raw', 'Fahrraddiebstahl.csv');
            const lorPath = path.join(process.cwd(), 'src', 'lib', 'lor-centroids.json');

            if (!fs.existsSync(csvPath)) {
                throw new Error(`CSV file not found at ${csvPath}`);
            }
            if (!fs.existsSync(lorPath)) {
                throw new Error(`LOR centroids file not found at ${lorPath}`);
            }

            const csvText = fs.readFileSync(csvPath, 'latin1');
            const lorText = fs.readFileSync(lorPath, 'utf-8');
            const lorCentroids: Record<string, LorCentroid> = JSON.parse(lorText);

            const parseResult = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
            });

            const rawData = parseResult.data as TheftRecord[];

            mappedData = rawData.reduce((acc: any[], record, index) => {
                if (!record.TATZEIT_ANFANG_DATUM) return acc;

                const dateParts = record.TATZEIT_ANFANG_DATUM.split('.');
                if (dateParts.length !== 3) return acc;

                const theftDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

                if (isNaN(theftDate.getTime())) return acc;
                if (!record.LOR) return acc;

                let lorData = lorCentroids[record.LOR];

                if (lorData) {
                    const coords = addJitter(lorData.lat, lorData.lng, 0.003);

                    acc.push({
                        id: `theft-${index}-${record.LOR}`,
                        lat: coords.lat,
                        lng: coords.lng,
                        amount: parseInt(record.SCHADENSHOEHE) || 0,
                        date: theftDate.toISOString(),
                        type: record.ART_DES_FAHRRADS,
                        lor: lorData.name,
                        rawLor: record.LOR,
                        details: record.DELIKT
                    });
                }

                return acc;
            }, []);

            globalForCache.bicycleTheftCache = mappedData;
        }

        const startDate = startDateStr ? new Date(startDateStr) : new Date(0);
        const endDate = endDateStr ? new Date(endDateStr) : new Date();

        endDate.setHours(23, 59, 59, 999);

        const filteredData = mappedData.filter(item => {
            const itemDate = new Date(item.date);
            const inDateRange = itemDate >= startDate && itemDate <= endDate;

            if (!inDateRange) return false;

            if (district && district !== 'Berlin' && district !== 'All') {
                const prefix = DISTRICT_TO_LOR_PREFIX[district];
                if (prefix) {
                    if (item.rawLor && item.rawLor.startsWith(prefix)) {
                        return true;
                    }
                    return false;
                }
            }

            return true;
        });

        return NextResponse.json(filteredData, {
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });

    } catch (error) {
        console.error('Error reading/parsing theft data:', error);
        return NextResponse.json({ error: 'Failed to load theft data' }, { status: 500 });
    }
}
