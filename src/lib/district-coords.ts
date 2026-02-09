// Mapping of Berlin District Codes (First 2 digits of LOR) to Center Coordinates (Lat, Lng)
// Source: Approximate centers of Berlin boroughs

export const districtCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
    '01': { lat: 52.5333, lng: 13.3833, name: 'Mitte' },
    '02': { lat: 52.5167, lng: 13.4333, name: 'Friedrichshain-Kreuzberg' },
    '03': { lat: 52.5833, lng: 13.4167, name: 'Pankow' },
    '04': { lat: 52.5000, lng: 13.2833, name: 'Charlottenburg-Wilmersdorf' },
    '05': { lat: 52.5333, lng: 13.1667, name: 'Spandau' },
    '06': { lat: 52.4333, lng: 13.2500, name: 'Steglitz-Zehlendorf' },
    '07': { lat: 52.4667, lng: 13.3833, name: 'Tempelhof-Schöneberg' },
    '08': { lat: 52.4667, lng: 13.4333, name: 'Neukölln' },
    '09': { lat: 52.4500, lng: 13.5667, name: 'Treptow-Köpenick' },
    '10': { lat: 52.5333, lng: 13.5833, name: 'Marzahn-Hellersdorf' },
    '11': { lat: 52.5167, lng: 13.5000, name: 'Lichtenberg' },
    '12': { lat: 52.6000, lng: 13.3333, name: 'Reinickendorf' },
};
