import type { TheftCsvRow } from './theft';

export interface TheftPoint {
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

export interface LorCentroid {
    lat: number;
    lng: number;
    name: string;
}

type JitterFn = (lat: number, lng: number, radiusDeg: number) => { lat: number; lng: number };

export function addJitter(lat: number, lng: number, radiusDeg: number = 0.002) {
    const r = radiusDeg * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    return {
        lat: lat + r * Math.cos(theta),
        lng: lng + r * Math.sin(theta) * 1.5
    };
}

/**
 * Maps raw police CSV rows to map points. Rows without a valid date or a known LOR are dropped.
 * `jitter` spreads points around the LOR centroid; injectable for deterministic tests.
 */
export function mapTheftRows(
    rows: TheftCsvRow[],
    theftType: 'bicycle' | 'car',
    lorCentroids: Record<string, LorCentroid>,
    jitter: JitterFn = addJitter
): TheftPoint[] {
    const isBike = theftType === 'bicycle';

    return rows.reduce((acc: TheftPoint[], record, index) => {
        if (!record.TATZEIT_ANFANG_DATUM || !record.LOR) return acc;

        const dateParts = record.TATZEIT_ANFANG_DATUM.split('.');
        if (dateParts.length !== 3) return acc;
        const theftDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
        if (isNaN(theftDate.getTime())) return acc;

        const lor = record.LOR;
        const lorData = lorCentroids[lor];
        if (lorData) {
            const coords = jitter(lorData.lat, lorData.lng, 0.003);

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
}
