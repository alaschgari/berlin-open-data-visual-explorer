import { describe, expect, it } from 'vitest';
import Papa from 'papaparse';
import { mapTheftRows } from '../theft-mapping';
import type { TheftCsvRow } from '../theft';

const centroids = { '01100101': { lat: 52.5, lng: 13.4, name: 'Stülerstraße' } };
const noJitter = (lat: number, lng: number) => ({ lat, lng });

const bikeCsv = `ANGELEGT_AM,TATZEIT_ANFANG_DATUM,TATZEIT_ANFANG_STUNDE,TATZEIT_ENDE_DATUM,TATZEIT_ENDE_STUNDE,LOR,SCHADENSHOEHE,VERSUCH,ART_DES_FAHRRADS,DELIKT,ERFASSUNGSGRUND
02.03.2025,01.03.2025,14,01.03.2025,16,01100101,850,Nein,Herrenfahrrad,Fahrraddiebstahl,Sonstiger schwerer Diebstahl
02.03.2025,kein-datum,14,01.03.2025,16,01100101,100,Nein,Damenfahrrad,Fahrraddiebstahl,x
02.03.2025,01.03.2025,14,01.03.2025,16,99999999,100,Nein,Damenfahrrad,Fahrraddiebstahl,x`;

const parse = (csv: string, delimiter: string) =>
    Papa.parse<TheftCsvRow>(csv, { header: true, skipEmptyLines: true, delimiter }).data;

describe('mapTheftRows', () => {
    it('maps valid bicycle rows and drops invalid dates and unknown LORs', () => {
        const points = mapTheftRows(parse(bikeCsv, ','), 'bicycle', centroids, noJitter);

        expect(points).toEqual([{
            id: 'bicycle-0-01100101',
            category: 'bicycle',
            lat: 52.5,
            lng: 13.4,
            amount: 850,
            date: new Date('2025-03-01').toISOString(),
            hour: 14,
            registeredDate: '2025-03-02',
            type: 'Herrenfahrrad',
            lor: 'Stülerstraße',
            rawLor: '01100101',
            details: 'Fahrraddiebstahl',
        }]);
    });

    it('uses car-specific columns and defaults for car rows', () => {
        const carCsv = 'TATZEIT_ANFANG_DATUM|TATZEIT_ANFANG_STUNDE|LOR|SCHADENSHOEHE|DELIKT|ERLANGTES_GUT|EINDRINGEN_IN_KFZ\n'
            + '05.04.2025|23:30|01100101||Kfz-Diebstahl||';
        const [point] = mapTheftRows(parse(carCsv, '|'), 'car', centroids, noJitter);

        expect(point).toMatchObject({ category: 'car', amount: 0, hour: 23, type: 'KFZ', details: 'Kfz-Diebstahl', registeredDate: null });
    });

    it('keeps jittered points close to the centroid', () => {
        const [point] = mapTheftRows(parse(bikeCsv, ','), 'bicycle', centroids);
        expect(Math.abs(point.lat - 52.5)).toBeLessThan(0.01);
        expect(Math.abs(point.lng - 13.4)).toBeLessThan(0.01);
    });
});
