
// Source: Amt für Statistik Berlin-Brandenburg (approximate values for 2023/2024)
export const DISTRICT_POPULATION: Record<string, number> = {
    "Mitte": 397134,
    "Friedrichshain-Kreuzberg": 293454,
    "Pankow": 424307,
    "Charlottenburg-Wilmersdorf": 343081,
    "Spandau": 257091,
    "Steglitz-Zehlendorf": 310071,
    "Tempelhof-Schöneberg": 355890,
    "Neukölln": 330017,
    "Treptow-Köpenick": 294081,
    "Marzahn-Hellersdorf": 291948,
    "Lichtenberg": 311881,
    "Reinickendorf": 268308,
    "Berlin": 3777553 // Total
};

export function getPopulation(district: string): number {
    return DISTRICT_POPULATION[district] || DISTRICT_POPULATION["Berlin"];
}
