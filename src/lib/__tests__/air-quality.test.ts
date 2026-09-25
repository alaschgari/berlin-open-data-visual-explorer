import { describe, expect, it } from 'vitest';
import { mergeStationsWithLqi, toHourlySeries, STATION_CODE_PATTERN, type RawLqi, type RawStation } from '../air-quality';

// Shapes taken from live luftdaten.berlin.de responses
const stations: RawStation[] = [
    { name: '010 Wedding', code: 'mc010', address: '13353 Berlin, Amrumer Str./Limburger Str.', lat: '52.54291000', lng: '13.34926000', active: true, stationgroups: ['background'] },
    { name: '124 Mariendorfer Damm', code: 'mc124', address: '12099 Berlin, Mariendorfer Damm 148', lat: '52.43800000', lng: '13.38770000', active: true, stationgroups: ['traffic'] },
    { name: '999 Stillgelegt', code: 'mc999', lat: '52.5', lng: '13.4', active: false },
];

const lqis: RawLqi[] = [
    { station: { code: 'MC010', category: 'background' }, data: { LQI_NO2: 1, LQI_O3: 2, LQI_PM10: 1, LQI_LQI: 2 }, datetime: '2026-09-25T13:00:00+02:00' },
];

describe('mergeStationsWithLqi', () => {
    it('joins stations with their index case-insensitively and drops inactive stations', () => {
        const result = mergeStationsWithLqi(stations, lqis);

        expect(result.map(s => s.code)).toEqual(['mc010', 'mc124']);
        expect(result[0]).toMatchObject({
            lat: 52.54291,
            lng: 13.34926,
            category: 'background',
            lqi: 2,
            pollutantIndex: { no2: 1, o3: 2, pm10: 1 },
            measuredAt: '2026-09-25T13:00:00+02:00',
        });
    });

    it('keeps stations without a current index', () => {
        const [, mariendorf] = mergeStationsWithLqi(stations, lqis);
        expect(mariendorf).toMatchObject({ category: 'traffic', lqi: null, pollutantIndex: {}, measuredAt: null });
    });

    it('drops stations with invalid coordinates', () => {
        expect(mergeStationsWithLqi([{ code: 'mc001', name: 'x', lat: 'n/a', lng: '13' }], [])).toEqual([]);
    });
});

describe('toHourlySeries', () => {
    it('keeps hourly values of displayed pollutants, oldest first', () => {
        const series = toHourlySeries([
            { datetime: '2026-09-25T13:00:00+02:00', core: 'pm10', period: '1h', value: 12 },
            { datetime: '2026-09-25T12:00:00+02:00', core: 'pm10', period: '1h', value: 14 },
            { datetime: '2026-09-25T13:00:00+02:00', core: 'nox', period: '1h', value: 26 },
            { datetime: '2026-09-25T13:00:00+02:00', core: 'no2', period: '24h', value: 20 },
            { datetime: '2026-09-25T13:00:00+02:00', core: 'o3', period: '1h', value: null },
        ]);

        expect(series).toEqual([
            { datetime: '2026-09-25T12:00:00+02:00', pollutant: 'pm10', value: 14 },
            { datetime: '2026-09-25T13:00:00+02:00', pollutant: 'pm10', value: 12 },
        ]);
    });
});

describe('STATION_CODE_PATTERN', () => {
    it('accepts station codes only', () => {
        expect(STATION_CODE_PATTERN.test('mc010')).toBe(true);
        expect(STATION_CODE_PATTERN.test('MC124')).toBe(true);
        expect(STATION_CODE_PATTERN.test('../stations')).toBe(false);
    });
});
