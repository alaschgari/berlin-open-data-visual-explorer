import fs from 'fs';
import path from 'path';

export interface WastewaterRecord {
    probennummer: string;
    datum: string;
    klaerwerk: string;
    uww_code: string;
    uww_name: string;
    durchfluss: number;
    temperatur: number;
    ph: number;
    methode: string;
    erreger: string;
    target: string;
    messwert: number;
}

const WASTEWATER_CSV_PATH = path.join(process.cwd(), 'data/raw/abwasser/BEWAC_abwassermonitoring_berlin.csv');

export function getWastewaterData(): WastewaterRecord[] {
    if (!fs.existsSync(WASTEWATER_CSV_PATH)) {
        console.warn(`Wastewater data file not found at ${WASTEWATER_CSV_PATH}`);
        return [];
    }

    const content = fs.readFileSync(WASTEWATER_CSV_PATH, 'utf-8');
    const lines = content.split('\n');
    const records: WastewaterRecord[] = [];

    // Header: "Probennummer";"Datum";"Klärwerk";"UWW_Code";"UWW_Name";"Durchfluss";"Abwasser_Temperatur";"Abwasser_pH";"Methode";"Erreger";"Target";"Messwert"
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(';').map(col => col.replace(/"/g, ''));
        if (cols.length < 12) continue;

        records.push({
            probennummer: cols[0],
            datum: cols[1],
            klaerwerk: cols[2],
            uww_code: cols[3],
            uww_name: cols[4],
            durchfluss: parseFloat(cols[5].replace(',', '.')),
            temperatur: parseFloat(cols[6].replace(',', '.')),
            ph: parseFloat(cols[7].replace(',', '.')),
            methode: cols[8],
            erreger: cols[9],
            target: cols[10],
            messwert: parseFloat(cols[11].replace(',', '.'))
        });
    }

    return records;
}
