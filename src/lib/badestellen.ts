import Papa from 'papaparse';

import { getLatestResourceUrl } from './ckan';
import { CKAN_PACKAGES } from './constants';

const DEFAULT_BADESTELLEN_CSV_URL = 'https://www.data.lageso.de/baden/0_letzte/letzte.csv';

export interface BadestelleProperties {
    id: string;
    badname: string;
    bezirk: string;
    dat: string;
    eco: string;
    ente: string;
    sicht: string;
    temp: string;
    farbe: string;
    badestellelink: string;
    profillink: string;
    pdflink: string;
}

export interface BadestelleFeature {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    properties: {
        title: string;
        href: string;
        description: string;
        id: string;
        data: BadestelleProperties;
    };
}

/**
 * Fetches all swimming spots from the LAGeSo CSV data source.
 * This is more reliable than the SimpleSearch API which is often unreachable.
 */
export async function getBadestellenLive(): Promise<BadestelleFeature[]> {
    try {
        const url = await getLatestResourceUrl(CKAN_PACKAGES.BADESTELLEN, 'CSV') || DEFAULT_BADESTELLEN_CSV_URL;
        
        const response = await fetch(url, {
            next: { revalidate: 10800 } // 3 hours
        });
        if (!response.ok) throw new Error(`CSV fetch failed: ${response.statusText}`);

        const csvText = await response.text();
        const results = Papa.parse(csvText, {
            header: false, // Header contains complex text, we'll map by index
            delimiter: ';',
            skipEmptyLines: true
        });

        const rows = results.data as string[][];
        // Skip header row if it's the first one
        const dataRows = rows.slice(1);

        return dataRows.map((row, idx) => {
            const lat = parseFloat(row[4]);
            const lng = parseFloat(row[5]);

            const props: BadestelleProperties = {
                id: row[13] || idx.toString(),
                badname: row[3],
                bezirk: row[1],
                dat: row[8],
                eco: row[10],
                ente: row[11],
                sicht: row[9],
                temp: row[17],
                farbe: row[12],
                badestellelink: row[7],
                profillink: row[6],
                pdflink: row[18]
            };

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                properties: {
                    title: props.badname,
                    href: props.badestellelink,
                    description: `${props.bezirk} - ${props.temp}°C`,
                    id: props.id,
                    data: props
                }
            };
        });
    } catch (error) {
        console.error('Failed to fetch Badestellen CSV data:', error);
        return [];
    }
}

/**
 * Maps the status image filename to a human-readable status and color.
 */
export function getStatusFromImage(image: string): { labelKey: string; color: string } {
    if (image.startsWith('gruen')) return { labelKey: 'swim_status_good', color: '#10b981' };
    if (image.startsWith('gelb')) return { labelKey: 'swim_status_warning', color: '#f59e0b' };
    if (image.startsWith('rot')) return { labelKey: 'swim_status_ban', color: '#ef4444' };
    return { labelKey: 'swim_status_unknown', color: '#6b7280' };
}
