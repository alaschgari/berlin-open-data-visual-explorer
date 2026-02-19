import json
import os

filepath = 'public/data/berlin-lor-planungsraeume.geojson'
with open(filepath, 'r') as f:
    data = json.load(f)

districts = {
    '01': 'Mitte',
    '02': 'Friedrichshain-Kreuzberg',
    '03': 'Pankow',
    '04': 'Charlottenburg-Wilmersdorf',
    '05': 'Spandau',
    '06': 'Steglitz-Zehlendorf',
    '07': 'Tempelhof-Schöneberg',
    '08': 'Neukölln',
    '09': 'Treptow-Köpenick',
    '10': 'Marzahn-Hellersdorf',
    '11': 'Lichtenberg',
    '12': 'Reinickendorf'
}

bboxes = {}

for feature in data['features']:
    props = feature['properties']
    key = props['SCHLUESSEL'][:2]
    if key in districts:
        district_name = districts[key]
        if district_name not in bboxes:
            bboxes[district_name] = {'min_lat': 90, 'max_lat': -90, 'min_lng': 180, 'max_lng': -180}
        
        geom = feature['geometry']
        coords = geom['coordinates']
        if geom['type'] == 'Polygon':
            coords_list = coords
        elif geom['type'] == 'MultiPolygon':
            coords_list = [c for p in coords for c in p]
        else:
            coords_list = []

        for ring in coords_list:
            for lon, lat in ring:
                bboxes[district_name]['min_lat'] = min(bboxes[district_name]['min_lat'], lat)
                bboxes[district_name]['max_lat'] = max(bboxes[district_name]['max_lat'], lat)
                bboxes[district_name]['min_lng'] = min(bboxes[district_name]['min_lng'], lon)
                bboxes[district_name]['max_lng'] = max(bboxes[district_name]['max_lng'], lon)

if bboxes:
    berlin_bbox = {'min_lat': 90, 'max_lat': -90, 'min_lng': 180, 'max_lng': -180}
    for b in bboxes.values():
        berlin_bbox['min_lat'] = min(berlin_bbox['min_lat'], b['min_lat'])
        berlin_bbox['max_lat'] = max(berlin_bbox['max_lat'], b['max_lat'])
        berlin_bbox['min_lng'] = min(berlin_bbox['min_lng'], b['min_lng'])
        berlin_bbox['max_lng'] = max(berlin_bbox['max_lng'], b['max_lng'])
    bboxes['Berlin'] = berlin_bbox

# Print explicitly
import sys
json.dump(bboxes, sys.stdout, indent=2)
print()
