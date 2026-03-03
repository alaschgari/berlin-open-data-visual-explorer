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

const WASTEWATER_CSV_URL = 'https://data.lageso.de/infektionsschutz/opendata/abwassermonitoring/BEWAC_abwassermonitoring_berlin.csv';

// Simple in-memory cache
let cachedData: WastewaterRecord[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function getWastewaterData(): Promise<WastewaterRecord[]> {
    "use cache";
    // Check cache
    if (cachedData && (Date.now() - lastFetchTime < CACHE_TTL)) {
        return cachedData;
    }

    try {
        const response = await fetch(WASTEWATER_CSV_URL);
        if (!response.ok) throw new Error(`Wastewater fetch failed: ${response.statusText}`);

        const content = await response.text();
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

        cachedData = records;
        lastFetchTime = Date.now();
        return records;
    } catch (error) {
        console.error('Failed to fetch wastewater data:', error);
        return cachedData || []; // Return stale cache if available, else empty
    }
}
