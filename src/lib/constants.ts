/**
 * CKAN Package IDs (Slugs) for Berlin Open Data datasets.
 * These can be found in the URL of the dataset on daten.berlin.de.
 */
export const CKAN_PACKAGES = {
  BICYCLE_THEFT: 'fahrraddiebstahl-in-berlin',
  CAR_THEFT: 'diebstahl-an-aus-kfz',
  BADESTELLEN: 'liste-der-badestellen-opendata-1568631',
  BUDGET: 'haushaltsplane',
  SUBSIDIES: 'simple_search_wwwberlindesenfinanzenservicezuwendungsdatenbank',
  MARKETS: 'wochen-und-troedelmaerkte',
  CONSTRUCTION_SITES: 'baustellen-sperrungen-und-sonstige-storungen-von-besonderem-verkehrlichem-interesse',
} as const;

export type CkanPackageKey = keyof typeof CKAN_PACKAGES;

/**
 * Maps Berlin district names to their two-digit Bezirk/LOR id prefix.
 * Single source of truth — do not duplicate this map elsewhere.
 */
export const DISTRICT_TO_LOR_PREFIX: Record<string, string> = {
  'Mitte': '01',
  'Friedrichshain-Kreuzberg': '02',
  'Pankow': '03',
  'Charlottenburg-Wilmersdorf': '04',
  'Spandau': '05',
  'Steglitz-Zehlendorf': '06',
  'Tempelhof-Schöneberg': '07',
  'Neukölln': '08',
  'Treptow-Köpenick': '09',
  'Marzahn-Hellersdorf': '10',
  'Lichtenberg': '11',
  'Reinickendorf': '12',
};

const LOR_PREFIX_TO_DISTRICT: Record<string, string> = Object.fromEntries(
  Object.entries(DISTRICT_TO_LOR_PREFIX).map(([name, prefix]) => [prefix, name])
);

export function getDistrictPrefix(district: string): string | null {
  return DISTRICT_TO_LOR_PREFIX[district] || null;
}

export function getDistrictNameByBezId(bezId: number | string): string {
  const prefix = String(bezId).padStart(2, '0');
  return LOR_PREFIX_TO_DISTRICT[prefix] || `Bezirk ${bezId}`;
}
