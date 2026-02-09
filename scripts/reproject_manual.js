const fs = require('fs');
const proj4 = require('proj4');

const inputFile = 'data/raw/lor_planungsraeume_2021.geojson';
const outputFile = 'data/raw/lor_planungsraeume_2021_wgs84.geojson';

// Define the source projection (EPSG:25833 - ETRS89 / UTM zone 33N)
const sourceProj = "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
const destProj = "+proj=longlat +datum=WGS84 +no_defs";

// Register definitions
proj4.defs("EPSG:25833", sourceProj);
proj4.defs("EPSG:4326", destProj);

function transformCoordinate(coord) {
    // proj4(from, to, point) returns [lon, lat]
    return proj4(sourceProj, destProj, coord);
}

function transformGeometry(geometry) {
    if (geometry.type === 'Point') {
        geometry.coordinates = transformCoordinate(geometry.coordinates);
    } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
        geometry.coordinates = geometry.coordinates.map(transformCoordinate);
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
        geometry.coordinates = geometry.coordinates.map(ring => ring.map(transformCoordinate));
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates = geometry.coordinates.map(poly => poly.map(ring => ring.map(transformCoordinate)));
    }
    return geometry;
}

try {
    console.log('Reading GeoJSON file...');
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const geoJson = JSON.parse(rawData);

    console.log('Transforming coordinates from EPSG:25833 to EPSG:4326...');

    if (geoJson.type === 'FeatureCollection') {
        geoJson.features.forEach(feature => {
            if (feature.geometry) {
                transformGeometry(feature.geometry);
            }
        });
    } else if (geoJson.type === 'Feature') {
        if (geoJson.geometry) {
            transformGeometry(geoJson.geometry);
        }
    }

    // Update CRS
    geoJson.crs = {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    };

    console.log('Writing transformed file...');
    fs.writeFileSync(outputFile, JSON.stringify(geoJson));
    console.log('Success! Created ' + outputFile);

} catch (error) {
    console.error('Error during transformation:', error);
}
