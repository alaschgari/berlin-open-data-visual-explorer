import fs from 'fs';
import path from 'path';
import proj4 from 'proj4';

const LOR_GEOJSON_URL = 'https://tsb-opendata.s3.eu-central-1.amazonaws.com/lor_planungsgraeume_2021/lor_planungsraeume_2021.geojson';

// Define the source projection (EPSG:25833 - ETRS89 / UTM zone 33N)
const EPSG_25833 = '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const EPSG_4326 = 'EPSG:4326'; // WGS84

async function generateCentroids() {
    console.log('Fetching LOR GeoJSON...');
    try {
        const response = await fetch(LOR_GEOJSON_URL);
        if (!response.ok) throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);

        const geojson = await response.json();
        const centroids: Record<string, { lat: number; lng: number; name: string }> = {};

        console.log(`Processing ${geojson.features.length} features...`);

        for (const feature of geojson.features) {
            if (!feature.properties || !feature.geometry) continue;

            const lorId = feature.properties.PLR_ID || feature.properties.plr_id || feature.properties.SCHLUESSEL;
            const name = feature.properties.PLR_NAME || feature.properties.plr_name || feature.properties.NAME;

            if (!lorId) {
                console.warn('Feature missing ID', feature.properties);
                continue;
            }

            // Calculate centroid of the polygon in its original CRS
            let points: number[][] = [];

            if (feature.geometry.type === 'Polygon') {
                points = feature.geometry.coordinates[0];
            } else if (feature.geometry.type === 'MultiPolygon') {
                points = feature.geometry.coordinates[0][0];
            }

            if (points.length === 0) continue;

            let sumX = 0, sumY = 0;
            for (const [x, y] of points) {
                sumX += x;
                sumY += y;
            }

            const avgX = sumX / points.length;
            const avgY = sumY / points.length;

            // Transform centroid to WGS84
            const [lng, lat] = proj4(EPSG_25833, EPSG_4326, [avgX, avgY]);

            centroids[lorId] = { lat, lng, name };
        }

        const outputPath = path.join(process.cwd(), 'src', 'lib', 'lor-centroids.json');
        fs.writeFileSync(outputPath, JSON.stringify(centroids, null, 2));
        console.log(`Successfully wrote ${Object.keys(centroids).length} LOR centroids to ${outputPath}`);

    } catch (error) {
        console.error('Error generating centroids:', error);
    }
}

generateCentroids();
