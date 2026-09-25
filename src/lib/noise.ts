/**
 * Strategic noise maps 2022 and quiet areas 2024 (Umweltatlas Berlin), served as WMS by gdi.berlin.de.
 * The map tiles are rendered by the WMS server; the app only selects layers.
 */

export const NOISE_WMS_URL = 'https://gdi.berlin.de/services/wms/ua_stratlaerm_2022';
export const QUIET_AREAS_WMS_URL = 'https://gdi.berlin.de/services/wms/ruhigegebiete_2024';
export const QUIET_AREAS_LAYER = 'a_ruhigegeb2024_rg';

export type NoisePeriod = 'den' | 'n';
export type NoiseSource = 'total' | 'road' | 'tram_ubahn' | 'air' | 'industry';

export const NOISE_SOURCES: NoiseSource[] = ['total', 'road', 'tram_ubahn', 'air', 'industry'];

const LAYERS: Record<NoiseSource, Record<NoisePeriod, string>> = {
    total: { den: 'bf_gesamtlaerm_den2022', n: 'cf_gesamtlaerm_n2022' },
    road: { den: 'bb_strasse_gesamt_den2022', n: 'cb_strasse_gesamt_n2022' },
    tram_ubahn: { den: 'bc_tram_ubahn_den2022', n: 'cc_tram_ubahn_n2022' },
    air: { den: 'bd_flug_gesamt_den2022', n: 'cd_flug_gesamt_n2022' },
    industry: { den: 'be_industrie_den2022', n: 'ce_industrie_n2022' },
};

export function noiseLayer(source: NoiseSource, period: NoisePeriod): string {
    return LAYERS[source][period];
}

/** Legend image rendered by the WMS server for a layer. */
export function legendUrl(layer: string, serviceUrl: string = NOISE_WMS_URL): string {
    const params = new URLSearchParams({
        service: 'WMS',
        request: 'GetLegendGraphic',
        version: '1.3.0',
        layer,
        format: 'image/png',
    });
    return `${serviceUrl}?${params}`;
}

/** Thresholds of the Berlin noise action plan above which noise is considered harmful to health. */
export const HEALTH_THRESHOLD_DB: Record<NoisePeriod, number> = { den: 65, n: 55 };
