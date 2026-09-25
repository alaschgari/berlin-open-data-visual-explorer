import { describe, expect, it } from 'vitest';
import {
    checkReplaceIsSafe,
    geoJsonToRows,
    marketsToRows,
    parseGermanAmount,
    parseSubsidiesCsv,
} from '../sync/transform';

const point = { type: 'Point', coordinates: [13.4, 52.5] };

describe('geoJsonToRows', () => {
    it('uses feature ids, falls back to properties.id and then an index', () => {
        const rows = geoJsonToRows({
            features: [
                { id: 'bpark.1', geometry: point, properties: { a: 1 } },
                { geometry: point, properties: { id: '/detail/7' } },
                { geometry: point, properties: null },
            ],
        }, 'parking');

        expect(rows.map(r => r.id)).toEqual(['bpark.1', '/detail/7', 'parking_2']);
        expect(rows[0].properties).toEqual({ a: 1 });
    });

    it('skips features without geometry and duplicate ids', () => {
        const rows = geoJsonToRows({
            features: [
                { id: 'a', geometry: point },
                { id: 'a', geometry: point },
                { id: 'b', geometry: null },
            ],
        }, 'x');
        expect(rows.map(r => r.id)).toEqual(['a']);
    });

    it('handles a missing feature list', () => {
        expect(geoJsonToRows({}, 'x')).toEqual([]);
    });
});

describe('marketsToRows', () => {
    it('takes the title from the feature properties', () => {
        const [row] = marketsToRows({
            features: [{ geometry: point, properties: { id: '/detail/7', title: 'Flohmarkt am Mauerpark' } }],
        });
        expect(row).toMatchObject({ id: '/detail/7', title: 'Flohmarkt am Mauerpark' });
    });
});

describe('parseGermanAmount', () => {
    it.each([
        ['1.234,56 €', 1234.56],
        ['500', 500],
        ['-12,5', -12.5],
        ['', 0],
        [undefined, 0],
        ['k. A.', 0],
    ])('parses %s', (input, expected) => {
        expect(parseGermanAmount(input)).toBe(expected);
    });
});

describe('parseSubsidiesCsv', () => {
    const header = 'id;name;geber;art;jahr;anschrift;politikbereich;zweck;betrag;empfaengerid';

    it('parses rows including quoted fields with delimiters and line breaks', () => {
        const csv = '﻿' + [
            header,
            '1;Verein A;SenBJF;Projektförderung;2024;Musterstr. 1;Jugend;"Zweck; mit Semikolon";"1.000,50";99',
            '2;Verein B;SenKult;Fehlbedarf;2023;;Kultur;"Zweck über\nzwei Zeilen";250;98',
        ].join('\n');

        expect(parseSubsidiesCsv(csv)).toEqual([
            { id: '1', recipient: 'Verein A', provider: 'SenBJF', type: 'Projektförderung', year: 2024, address: 'Musterstr. 1', area: 'Jugend', purpose: 'Zweck; mit Semikolon', amount: 1000.5 },
            { id: '2', recipient: 'Verein B', provider: 'SenKult', type: 'Fehlbedarf', year: 2023, address: '', area: 'Kultur', purpose: 'Zweck über\nzwei Zeilen', amount: 250 },
        ]);
    });

    it('drops incomplete rows and duplicate ids', () => {
        const csv = [header, '1;A;B;C;2024;D;E;F;10;1', '1;A;B;C;2024;D;E;F;20;1', 'kaputt;zeile'].join('\n');
        const rows = parseSubsidiesCsv(csv);
        expect(rows).toHaveLength(1);
        expect(rows[0].amount).toBe(10);
    });

    it('returns nothing for an HTML error page', () => {
        expect(parseSubsidiesCsv('<html><body>Wartungsarbeiten</body></html>')).toEqual([]);
    });
});

describe('checkReplaceIsSafe', () => {
    it('rejects empty results', () => {
        expect(checkReplaceIsSafe(0, 100).ok).toBe(false);
        expect(checkReplaceIsSafe(0, 0).ok).toBe(false);
    });

    it('rejects results that shrink below the threshold', () => {
        expect(checkReplaceIsSafe(40, 100).ok).toBe(false);
        expect(checkReplaceIsSafe(50, 100).ok).toBe(true);
    });

    it('allows the first import into an empty table', () => {
        expect(checkReplaceIsSafe(10, 0).ok).toBe(true);
    });
});
