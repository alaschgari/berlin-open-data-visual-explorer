/**
 * CKAN Utility for Berlin Open Data (daten.berlin.de)
 */

const CKAN_BASE_URL = 'https://datenregister.berlin.de/api/3/action';

export interface CkanResource {
  id: string;
  name: string;
  url: string;
  format: string;
  description: string;
  last_modified: string;
  created: string;
}

export interface CkanPackage {
  id: string;
  name: string;
  title: string;
  resources: CkanResource[];
  metadata_modified: string;
  notes: string;
}

/**
 * Fetches metadata for a specific CKAN package.
 */
export async function getPackageMetadata(packageId: string): Promise<CkanPackage | null> {
  try {
    const response = await fetch(`${CKAN_BASE_URL}/package_show?id=${packageId}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.warn(`CKAN: Failed to fetch package metadata for ${packageId}: ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    if (!json.success) return null;

    return json.result as CkanPackage;
  } catch (error) {
    console.error(`CKAN: Error fetching metadata for ${packageId}:`, error);
    return null;
  }
}

/**
 * Finds the URL for the first resource in a package that matches the specified format.
 */
export async function getLatestResourceUrl(
  packageId: string,
  format: string = 'CSV'
): Promise<string | null> {
  const metadata = await getPackageMetadata(packageId);
  if (!metadata) return null;

  const fmt = format.toUpperCase();
  const resource = metadata.resources.find(r => {
    const rFormat = r.format.toUpperCase();
    if (rFormat === fmt) return true;
    if (fmt === 'GEOJSON' && rFormat === 'JSON') return true;
    if (fmt === 'JSON' && rFormat === 'GEOJSON') return true;
    return false;
  });

  return resource ? resource.url : null;
}

/**
 * Gets the last modification date of a package.
 */
export async function getPackageLastModified(packageId: string): Promise<string | null> {
  const metadata = await getPackageMetadata(packageId);
  return metadata?.metadata_modified || null;
}
