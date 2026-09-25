import type { Feature, FeatureCollection, Geometry } from 'geojson';

/** Properties of an LOR planning area (Planungsraum) as served by /api/lor. */
export interface LorProperties {
    PLR_ID: string;
    PLR_NAME: string;
    GROESSE_M2: number;
    [key: string]: unknown;
}

export type LorFeature = Feature<Geometry, LorProperties>;
export type LorFeatureCollection = FeatureCollection<Geometry, LorProperties>;

/**
 * One row of the resident register (Einwohnerregister) per planning area, as served by /api/demographics.
 * Age-group columns follow the pattern E_E<from>U<to>; all values are counts.
 */
export interface DemographicsRecord {
    RAUMID: number;
    BEZ: number;
    E_E: number;
    E_EM: number;
    E_EW: number;
    E_E1U6: number;
    E_E6U15: number;
    E_E15U18: number;
    E_E18U25: number;
    E_E25U55: number;
    E_E55U65: number;
    E_E65U80: number;
    E_E80U110: number;
    [key: string]: number;
}
