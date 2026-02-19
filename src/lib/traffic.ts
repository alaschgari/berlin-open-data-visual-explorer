export interface BBox {
    min_lat: number;
    min_lng: number;
    max_lat: number;
    max_lng: number;
}

export const DISTRICT_BBOXES: Record<string, BBox> = {
    "Berlin": {
        "min_lat": 52.3382449,
        "min_lng": 13.0883476,
        "max_lat": 52.6754755,
        "max_lng": 13.7611541
    },
    "Mitte": {
        "min_lat": 52.4987357,
        "min_lng": 13.3015376,
        "max_lat": 52.5676684,
        "max_lng": 13.4294017
    },
    "Friedrichshain-Kreuzberg": {
        "min_lat": 52.4827923,
        "min_lng": 13.3682291,
        "max_lat": 52.5310293,
        "max_lng": 13.4914434
    },
    "Pankow": {
        "min_lat": 52.5198386,
        "min_lng": 13.3475592,
        "max_lat": 52.6754755,
        "max_lng": 13.5228704
    },
    "Charlottenburg-Wilmersdorf": {
        "min_lat": 52.4664729,
        "min_lng": 13.1865954,
        "max_lat": 52.5494336,
        "max_lng": 13.3414287
    },
    "Spandau": {
        "min_lat": 52.439615,
        "min_lng": 13.1092963,
        "max_lat": 52.5988074,
        "max_lng": 13.2824665
    },
    "Steglitz-Zehlendorf": {
        "min_lat": 52.3872254,
        "min_lng": 13.0883476,
        "max_lat": 52.4718369,
        "max_lng": 13.3716004
    },
    "Tempelhof-Schöneberg": {
        "min_lat": 52.3761269,
        "min_lng": 13.3199923,
        "max_lat": 52.5049424,
        "max_lng": 13.4274572
    },
    "Neukölln": {
        "min_lat": 52.3959466,
        "min_lng": 13.3994933,
        "max_lat": 52.495865,
        "max_lng": 13.5241327
    },
    "Treptow-Köpenick": {
        "min_lat": 52.3382449,
        "min_lng": 13.4396363,
        "max_lat": 52.4977068,
        "max_lng": 13.7611541
    },
    "Marzahn-Hellersdorf": {
        "min_lat": 52.470523,
        "min_lng": 13.5169658,
        "max_lat": 52.5745361,
        "max_lng": 13.658593
    },
    "Lichtenberg": {
        "min_lat": 52.4678355,
        "min_lng": 13.4561898,
        "max_lat": 52.5964434,
        "max_lng": 13.5676755
    },
    "Reinickendorf": {
        "min_lat": 52.5488072,
        "min_lng": 13.2012543,
        "max_lat": 52.6607614,
        "max_lng": 13.3892788
    }
};

export function getBBoxString(district: string): string {
    const bbox = DISTRICT_BBOXES[district] || DISTRICT_BBOXES["Berlin"];
    // Telraam expects: min_lng,min_lat,max_lng,max_lat
    return `${bbox.min_lng},${bbox.min_lat},${bbox.max_lng},${bbox.max_lat}`;
}

export function getSnapshotBBoxString(district: string): string {
    const bbox = DISTRICT_BBOXES[district] || DISTRICT_BBOXES["Berlin"];
    // Telraam Snapshot expects: lon_ul,lat_ul,lon_br,lat_br
    return `${bbox.min_lng},${bbox.max_lat},${bbox.max_lng},${bbox.min_lat}`;
}

export function getDistrictFromCoordinates(lat: number, lng: number): string {
    for (const [district, bbox] of Object.entries(DISTRICT_BBOXES)) {
        if (district === "Berlin") continue; // Skip the container district
        if (
            lat >= bbox.min_lat &&
            lat <= bbox.max_lat &&
            lng >= bbox.min_lng &&
            lng <= bbox.max_lng
        ) {
            return district;
        }
    }
    return "Unknown";
}
