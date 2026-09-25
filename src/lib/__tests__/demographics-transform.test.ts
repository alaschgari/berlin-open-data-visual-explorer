import { describe, expect, it } from 'vitest';
import { parseDemographicsCsv } from '../sync/transform';

const header = 'ZEIT;BEZ;PGR;BZR;PLR;RAUMID;BEZPGR;E_E;E_EM;E_EW;E_E1U6;E_E65U80';

describe('parseDemographicsCsv', () => {
    it('keeps one row per planning area with the full record in data', () => {
        const csv = '﻿' + [
            header,
            '202412;1;10;1;1;1100101;110;3580;1869;1711;128;455',
            '202412;1;10;1;2;1100102;110;4200;2100;2100;150;300',
        ].join('\n');

        const rows = parseDemographicsCsv(csv);

        expect(rows.map(r => r.raumid)).toEqual([1100101, 1100102]);
        expect(rows[0]).toMatchObject({ zeit: 202412, bez: 1, e_e: 3580, e_em: 1869, e_ew: 1711 });
        expect(rows[0].data).toMatchObject({ RAUMID: 1100101, E_E: 3580, E_E1U6: 128, E_E65U80: 455 });
    });

    it('normalizes lowercase headers and skips rows without a planning area id', () => {
        const csv = [header.toLowerCase(), '202412;1;10;1;1;;110;1;1;0;0;0', '202412;2;20;1;1;2100101;220;10;5;5;1;1'].join('\n');
        const rows = parseDemographicsCsv(csv);
        expect(rows).toHaveLength(1);
        expect(rows[0].raumid).toBe(2100101);
    });

    it('drops duplicate planning areas', () => {
        const line = '202412;1;10;1;1;1100101;110;1;1;0;0;0';
        expect(parseDemographicsCsv([header, line, line].join('\n'))).toHaveLength(1);
    });
});
