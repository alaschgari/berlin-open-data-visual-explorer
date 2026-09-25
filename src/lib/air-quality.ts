/**
 * Live air quality from the Berlin air quality monitoring network (BLUME), luftdaten.berlin.de.
 * Stations and the hourly air quality index (LQI) are fetched on demand and cached by Next.js.
 */

const BLUME_API = 'https://luftdaten.berlin.de/api';

/** Pollutants shown in the UI, keyed by the API's `core` component name. */
export const POLLUTANTS = ['pm10', 'pm2', 'no2', 'o3'] as const;
export type Pollutant = typeof POLLUTANTS[number];

export type StationCategory = 'traffic' | 'background' | 'suburb' | 'other';

export interface AirStation {
    code: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    category: StationCategory;
    /** Overall index, 1 = best. Null when the station reported no index this hour. */
    lqi: number | null;
    /** Sub-indices per pollutant, e.g. { no2: 1, pm10: 2 }. */
    pollutantIndex: Partial<Record<Pollutant | 'co', number>>;
    measuredAt: string | null;
}

export interface AirMeasurement {
    datetime: string;
    pollutant: Pollutant;
    value: number;
}

// Raw API shapes (only the fields we use)
export interface RawStation {
    code: string;
    name: string;
    address?: string;
    lat: string | number;
    lng: string | number;
    active?: boolean;
    stationgroups?: string[];
}

export interface RawLqi {
    station: { code: string; category?: string };
    data: Record<string, number | null>;
    datetime?: string;
}

export interface RawMeasurement {
    datetime: string;
    core: string;
    period: string;
    value: number | null;
}

function toCategory(value: string | undefined): StationCategory {
    return value === 'traffic' || value === 'background' || value === 'suburb' ? value : 'other';
}

/** Joins active stations with their current index. Station codes differ in case between endpoints. */
export function mergeStationsWithLqi(stations: RawStation[], lqis: RawLqi[]): AirStation[] {
    const lqiByCode = new Map(lqis.map(l => [l.station.code.toLowerCase(), l]));

    return stations
        .filter(s => s.active !== false)
        .map(s => {
            const lat = Number(s.lat);
            const lng = Number(s.lng);
            const lqi = lqiByCode.get(s.code.toLowerCase());

            const pollutantIndex: AirStation['pollutantIndex'] = {};
            for (const [key, value] of Object.entries(lqi?.data ?? {})) {
                const pollutant = key.replace(/^LQI_/, '').toLowerCase();
                if (pollutant !== 'lqi' && typeof value === 'number') {
                    pollutantIndex[pollutant as Pollutant | 'co'] = value;
                }
            }

            return {
                code: s.code.toLowerCase(),
                name: s.name,
                address: s.address ?? '',
                lat,
                lng,
                category: toCategory(lqi?.station.category ?? s.stationgroups?.[0]),
                lqi: typeof lqi?.data.LQI_LQI === 'number' ? lqi.data.LQI_LQI : null,
                pollutantIndex,
                measuredAt: lqi?.datetime ?? null,
            };
        })
        .filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng));
}

/** Keeps hourly values of the displayed pollutants, oldest first. */
export function toHourlySeries(raw: RawMeasurement[]): AirMeasurement[] {
    return raw
        .filter((m): m is RawMeasurement & { value: number } =>
            m.period === '1h' && typeof m.value === 'number' && (POLLUTANTS as readonly string[]).includes(m.core))
        .map(m => ({ datetime: m.datetime, pollutant: m.core as Pollutant, value: m.value }))
        .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export const STATION_CODE_PATTERN = /^mc\d{3}$/i;

async function fetchJson<T>(path: string, revalidate: number): Promise<T> {
    const response = await fetch(`${BLUME_API}${path}`, {
        next: { revalidate },
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`BLUME ${path}: HTTP ${response.status}`);
    return response.json() as Promise<T>;
}

export async function getAirStations(): Promise<AirStation[]> {
    const [stations, lqis] = await Promise.all([
        fetchJson<RawStation[]>('/stations', 86400),
        fetchJson<RawLqi[]>('/lqi', 900),
    ]);
    return mergeStationsWithLqi(stations, lqis);
}

export async function getStationSeries(code: string): Promise<AirMeasurement[]> {
    if (!STATION_CODE_PATTERN.test(code)) throw new Error(`Invalid station code: ${code}`);
    return toHourlySeries(await fetchJson<RawMeasurement[]>(`/stations/${code.toLowerCase()}/data`, 900));
}
