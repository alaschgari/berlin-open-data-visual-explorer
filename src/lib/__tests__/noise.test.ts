import { describe, expect, it } from 'vitest';
import { legendUrl, noiseLayer, NOISE_SOURCES, NOISE_WMS_URL } from '../noise';

describe('noiseLayer', () => {
    it('maps every source and period to a 2022 layer of the matching index', () => {
        for (const source of NOISE_SOURCES) {
            expect(noiseLayer(source, 'den')).toMatch(/_den2022$/);
            expect(noiseLayer(source, 'n')).toMatch(/_n2022$/);
        }
        expect(noiseLayer('total', 'den')).toBe('bf_gesamtlaerm_den2022');
    });
});

describe('legendUrl', () => {
    it('builds a GetLegendGraphic request for the layer', () => {
        const url = new URL(legendUrl('bf_gesamtlaerm_den2022'));
        expect(`${url.origin}${url.pathname}`).toBe(NOISE_WMS_URL);
        expect(url.searchParams.get('request')).toBe('GetLegendGraphic');
        expect(url.searchParams.get('layer')).toBe('bf_gesamtlaerm_den2022');
    });
});
