'use server';

import Papa from 'papaparse';

export interface TheftRecord {
    ANGELEGT_AM: string;
    TATZEIT_ANFANG_DATUM: string;
    TATZEIT_ANFANG_STUNDE: string;
    TATZEIT_ENDE_DATUM: string;
    TATZEIT_ENDE_STUNDE: string;
    LOR: string;
    SCHADENSHOEHE: string;
    VERSUCH: string;
}

export interface BikeTheftRecord extends TheftRecord {
    ART_DES_FAHRRADS: string;
    DELIKT: string;
    ERFASSUNGSGRUND: string;
}

export interface CarTheftRecord extends TheftRecord {
    DELIKT: string;
    EINDRINGEN_IN_KFZ: string;
    ERLANGTES_GUT: string;
}

import { getLatestResourceUrl } from './ckan';
import { CKAN_PACKAGES } from './constants';

const DEFAULT_BIKE_THEFT_URL = 'https://www.polizei-berlin.eu/Fahrraddiebstahl/Fahrraddiebstahl.csv';
const DEFAULT_CAR_THEFT_URL = 'https://www.polizei-berlin.eu/Kfzdiebstahl/Kfzdiebstahl.csv';

// Cache structure
interface TheftCache {
    data: any[] | null;
    timestamp: number;
}

const cache: Record<string, TheftCache> = {
    bicycle: { data: null, timestamp: 0 },
    car: { data: null, timestamp: 0 }
};

const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

export async function fetchLiveTheftData(type: 'bicycle' | 'car'): Promise<any[]> {
    const now = Date.now();
    if (cache[type].data && (now - cache[type].timestamp < CACHE_TTL)) {
        return cache[type].data!;
    }

    const packageId = type === 'bicycle' ? CKAN_PACKAGES.BICYCLE_THEFT : CKAN_PACKAGES.CAR_THEFT;
    const defaultUrl = type === 'bicycle' ? DEFAULT_BIKE_THEFT_URL : DEFAULT_CAR_THEFT_URL;
    
    // Attempt to get latest URL from CKAN, fallback to default
    const url = await getLatestResourceUrl(packageId, 'CSV') || defaultUrl;
    const delimiter = type === 'bicycle' ? ',' : '|';

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const decoder = new TextDecoder('windows-1252'); // Better for latin1 with special chars
        const csvText = decoder.decode(arrayBuffer);

        const parseResult = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            delimiter: delimiter
        });

        if (parseResult.errors.length > 0) {
            console.warn(`CSV parsing errors for ${type}:`, parseResult.errors[0]);
        }

        cache[type] = {
            data: parseResult.data,
            timestamp: now
        };

        return parseResult.data;
    } catch (error) {
        console.error(`Error fetching ${type} theft data:`, error);
        return cache[type].data || [];
    }
}

export async function getTheftCount(): Promise<number> {
    "use cache";
    const bikeData = await fetchLiveTheftData('bicycle');
    const carData = await fetchLiveTheftData('car');
    return (bikeData?.length || 0) + (carData?.length || 0);
}
