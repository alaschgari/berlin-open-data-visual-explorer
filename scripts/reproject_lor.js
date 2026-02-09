const fs = require('fs');
const { reproject } = require('reproject');
const proj4 = require('proj4');

const inputFile = 'data/raw/lor_planungsraeume_2021.geojson';
const outputFile = 'data/raw/lor_planungsraeume_2021_wgs84.geojson';

// Define the source projection (EPSG:25833 - ETRS89 / UTM zone 33N)
const epsg25833 = "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

// Define EPSG:4326 (WGS84)
const epsg4326 = "+proj=longlat +datum=WGS84 +no_defs";

try {
    console.log('Reading GeoJSON file...');
    const geoJson = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    console.log('Reprojecting from EPSG:25833 to EPSG:4326...');

    // We modify the input GeoJSON's CRS to ensure reproject understands what it IS,
    // although reproject function can take 'from' argument.
    // The library 'reproject' is a bit specific. The second argument is a lookup object (like epsg-index), or a proj4 interface.
    // If we pass proj4, it uses proj4.defs().

    // Let's register defs in proj4
    proj4.defs("EPSG:25833", epsg25833);
    proj4.defs("EPSG:4326", epsg4326);
    proj4.defs("urn:ogc:def:crs:EPSG::25833", epsg25833); // Register the URN alias too just in case

    const reprojected = reproject(geoJson, proj4, "EPSG:25833", "EPSG:4326");

    // Update the CRS property to reflect WGS84
    reprojected.crs = {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    };

    console.log('Writing reprojected file...');
    fs.writeFileSync(outputFile, JSON.stringify(reprojected));

    console.log('Done! Created ' + outputFile);
} catch (error) {
    console.error('Error:', error);
    // Print first coordinate to see what we are dealing with
    const geoJson = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    console.log("Sample coord:", geoJson.features[0].geometry.coordinates[0][0][0]);
}
