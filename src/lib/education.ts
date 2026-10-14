/**
 * Day-care centres (Kitas) and schools from the Berlin geodata infrastructure (gdi.berlin.de WFS).
 * Both layers are small enough (~3,000 and ~1,000 points) to be fetched live and cached by the CDN.
 */

const WFS_BASE = 'https://gdi.berlin.de/services/wfs';

export type FacilityKind = 'kita' | 'school';

export interface Facility {
    id: string;
    kind: FacilityKind;
    name: string;
    district: string;
    address: string;
    lat: number;
    lng: number;
    /** Kita: Kindertagesstätte, Eltern-Initiativ-Kita …; school: Grundschule, Gymnasium … */
    type: string;
    /** Kita: freie Träger / öffentlich …; school: oeffentlich / privat */
    provider: string;
    /** Licensed places (Kitas only). */
    places: number | null;
    website: string | null;
}

interface RawFeature {
    id?: string;
    geometry: { type: string; coordinates: [number, number] } | null;
    properties: Record<string, string | null | undefined>;
}

export interface RawFeatureCollection {
    features: RawFeature[];
}

const clean = (value: string | null | undefined) => (value ?? '').trim();

function point(feature: RawFeature): [number, number] | null {
    if (feature.geometry?.type !== 'Point') return null;
    const [lng, lat] = feature.geometry.coordinates;
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

function website(value: string | null | undefined): string | null {
    const url = clean(value);
    return /^https?:\/\//i.test(url) ? url : null;
}

export function toKitas(collection: RawFeatureCollection): Facility[] {
    return collection.features.flatMap(f => {
        const p = f.properties;
        const coords = point(f);
        if (!coords || !clean(p.e_name)) return [];
        const places = Number.parseInt(clean(p.e_platz), 10);
        return [{
            id: `kita-${clean(p.e_nr) || f.id}`,
            kind: 'kita' as const,
            name: clean(p.e_name),
            district: clean(p.e_bez),
            address: `${clean(p.e_strasse)} ${clean(p.e_hnr)}${clean(p.e_zusatz)}, ${clean(p.e_plz)} Berlin`.trim(),
            lat: coords[0],
            lng: coords[1],
            type: clean(p.e_art),
            provider: clean(p.t_art),
            places: Number.isFinite(places) ? places : null,
            website: website(p.e_web),
        }];
    });
}

export function toSchools(collection: RawFeatureCollection): Facility[] {
    return collection.features.flatMap(f => {
        const p = f.properties;
        const coords = point(f);
        if (!coords || !clean(p.schulname)) return [];
        return [{
            id: `school-${clean(p.bsn) || f.id}`,
            kind: 'school' as const,
            name: clean(p.schulname),
            district: clean(p.bezirk),
            address: `${clean(p.strasse)} ${clean(p.hausnr)}, ${clean(p.plz)} Berlin`.trim(),
            lat: coords[0],
            lng: coords[1],
            type: clean(p.schulart),
            provider: clean(p.traeger),
            places: null,
            website: website(p.internet),
        }];
    });
}

export function featureUrl(service: string, typeName: string): string {
    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: typeName,
        outputFormat: 'application/json',
        srsName: 'EPSG:4326',
    });
    return `${WFS_BASE}/${service}?${params}`;
}

async function fetchCollection(service: string, typeName: string): Promise<RawFeatureCollection> {
    // The raw responses exceed the 2 MB data cache limit; the API route is cached by the CDN instead
    const response = await fetch(featureUrl(service, typeName), { cache: 'no-store' });
    if (!response.ok) throw new Error(`WFS ${service}: HTTP ${response.status}`);
    return response.json() as Promise<RawFeatureCollection>;
}

export async function getFacilities(): Promise<Facility[]> {
    const [kitas, schools] = await Promise.all([
        fetchCollection('kita', 'kita:kita'),
        fetchCollection('schulen', 'schulen:schulen'),
    ]);
    return [...toKitas(kitas), ...toSchools(schools)];
}
