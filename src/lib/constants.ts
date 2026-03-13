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
