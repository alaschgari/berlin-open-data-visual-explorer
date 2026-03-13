import { getLatestResourceUrl } from './ckan';
import { CKAN_PACKAGES } from './constants';

export async function getBaustellenLive(): Promise<any> {
    const DEFAULT_URL = 'https://viz.berlin.de/daten/ereignisse.geojson';
    
    try {
        // Dynamically find the GeoJSON resource for construction sites
        const url = await getLatestResourceUrl(CKAN_PACKAGES.CONSTRUCTION_SITES, 'GeoJSON') || DEFAULT_URL;
        
        const response = await fetch(url, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching Baustellen data:', error);
        return { type: 'FeatureCollection', features: [] };
    }
}
