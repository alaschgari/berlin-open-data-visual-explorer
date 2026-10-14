import { describe, expect, it } from 'vitest';
import { featureUrl, toKitas, toSchools } from '../education';

const kita = {
    id: 'kita.01010010',
    geometry: { type: 'Point', coordinates: [13.38439251, 52.52251616] as [number, number] },
    properties: {
        e_nr: '01010010', e_name: 'Kita F.A.I.R.play', e_bez: 'Mitte', e_plz: '10117',
        e_strasse: 'Albrechtstr.', e_hnr: '20', e_zusatz: '', e_platz: '65',
        e_art: 'Kindertagesstätte', t_art: 'freie Träger', e_web: 'http://www.gfj-berlin.de',
    },
};

const school = {
    id: 'schulen.01B01',
    geometry: { type: 'Point', coordinates: [13.35786711, 52.5239061] as [number, number] },
    properties: {
        bsn: '01B01', schulname: 'OSZ Banken, Immobilien und Versicherungen', schulart: 'Oberstufenzentrum',
        traeger: 'oeffentlich', bezirk: 'Mitte', plz: '10557', strasse: 'Alt-Moabit', hausnr: '10',
        internet: 'https://www.osz-biv.de',
    },
};

describe('toKitas', () => {
    it('maps WFS properties and swaps lng/lat', () => {
        expect(toKitas({ features: [kita] })).toEqual([{
            id: 'kita-01010010', kind: 'kita', name: 'Kita F.A.I.R.play', district: 'Mitte',
            address: 'Albrechtstr. 20, 10117 Berlin', lat: 52.52251616, lng: 13.38439251,
            type: 'Kindertagesstätte', provider: 'freie Träger', places: 65, website: 'http://www.gfj-berlin.de',
        }]);
    });

    it('drops features without geometry and keeps unknown places as null', () => {
        const noPlaces = { ...kita, properties: { ...kita.properties, e_platz: '', e_web: 'www.example.org' } };
        const [result] = toKitas({ features: [noPlaces, { ...kita, geometry: null }] });
        expect(result.places).toBeNull();
        expect(result.website).toBeNull();
        expect(toKitas({ features: [{ ...kita, geometry: null }] })).toEqual([]);
    });
});

describe('toSchools', () => {
    it('maps WFS properties', () => {
        const [result] = toSchools({ features: [school] });
        expect(result).toMatchObject({
            id: 'school-01B01', kind: 'school', district: 'Mitte', type: 'Oberstufenzentrum',
            provider: 'oeffentlich', address: 'Alt-Moabit 10, 10557 Berlin', places: null, lat: 52.5239061,
        });
    });
});

describe('featureUrl', () => {
    it('requests GeoJSON in WGS84', () => {
        const url = new URL(featureUrl('kita', 'kita:kita'));
        expect(url.pathname).toBe('/services/wfs/kita');
        expect(url.searchParams.get('outputFormat')).toBe('application/json');
        expect(url.searchParams.get('srsName')).toBe('EPSG:4326');
        expect(url.searchParams.get('typeNames')).toBe('kita:kita');
    });
});
