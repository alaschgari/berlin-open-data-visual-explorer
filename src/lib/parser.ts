
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const RAW_DIR = path.join(process.cwd(), 'data/raw');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

export interface FinancialRecord {
    year: number;
    district: string;
    chapter: string; // Kapitel
    title_code: string; // Titel
    budget: number; // Ansatz
    actual: number; // Ist
    diff: number; // Budget - Actual
}

export async function processFiles() {
    if (!fs.existsSync(RAW_DIR)) return [];

    const allFiles = fs.readdirSync(RAW_DIR);

    // Deduplicate files: Group by Budget Period (e.g. "2024_2025") and select the latest version (Nachtrag)
    // Heuristic: 
    // 1. Identify "Doppelhaushalt" files
    // 2. Group by years found in filename
    // 3. Pick the one with highest 'nachtrag' number or valid latest timestamp/length

    // Simplification for now: Explicit ignore list or "Latest wins" based on sorting
    // We strictly want to avoid processing the same year from multiple files if they represent updates.

    // Grouping map
    const fileGroups: Record<string, string[]> = {};

    allFiles.forEach(f => {
        if (!f.match(/\.(xlsx|xls|json|csv)$/i)) return;

        let key = 'misc';
        if (f.includes('2024_2025')) key = '2024_2025';
        else if (f.includes('2022_2023')) key = '2022_2023';
        else if (f.includes('2020_2021')) key = '2020_2021'; // If exists
        else key = f; // Unique misc files are kept

        if (!fileGroups[key]) fileGroups[key] = [];
        fileGroups[key].push(f);
    });

    const filesToProcess: string[] = [];

    Object.keys(fileGroups).forEach(key => {
        const group = fileGroups[key];
        if (key === 'misc' || group.length === 1) {
            filesToProcess.push(...group);
        } else {
            // Pick the "best" file for this period
            // Prefer CSV over Excel?
            // Prefer "Nachtrag" with highest number?

            // Sort by: 
            // 1. Contains 'nachtrag' (descending numeric val)
            // 2. File extension (CSV preferred)?

            group.sort((a, b) => {
                const getVal = (name: string) => {
                    const match = name.match(/(\d+)[_.]?nachtrag/i);
                    return match ? parseInt(match[1]) : 0;
                };
                return getVal(b) - getVal(a); // Highest nachtrag first
            });

            const best = group[0];
            console.log(`[Parser] For period ${key}, selected ${best} out of ${group.length} files.`);
            filesToProcess.push(best);
        }
    });

    let records: FinancialRecord[] = [];

    for (const file of filesToProcess) {

        console.log(`Processing file: ${file}`);
        const filePath = path.join(RAW_DIR, file);

        try {
            if (file.toLowerCase().includes('doppelhaushalt') && file.endsWith('.csv')) {
                const newRecords = parseDoppelhaushalt(filePath);
                records = [...records, ...newRecords];
            } else if (file.endsWith('.json')) {
                // Handle JSON (if any)
                const content = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(content);
                // ... mapping logic for JSON
            } else {
                // Handle Excel
                if (!fs.existsSync(filePath)) {
                    console.error(`File does not exist: ${filePath}`);
                    continue;
                }
                const buffer = fs.readFileSync(filePath);
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rawData = XLSX.utils.sheet_to_json(sheet);


                for (const row of rawData as any[]) {
                    // Extract district from filename if not present
                    const district = getDistrictFromFilename(file);
                    // Basic mapping based on observed headers
                    // Need to handle different possible header names or just grab specific properties
                    const year = row['Haushaltsjahr'] || row['Jahr'];
                    const chapter = row['Kapitel'];
                    const titleCode = row['Titel'];
                    const budget = parseCurrency(row['Ansatz']);
                    const actual = parseCurrency(row['Ist']);

                    const titleStr = String(titleCode || '');
                    const isLeaf = titleStr.length === 5; // Haushalts-Titel are usually 5 digits leaf nodes
                    const titleType = String(row['Titelart'] || '').toLowerCase();
                    const isExpense = titleType.includes('ausgabe') || !titleType.includes('einnahme'); // Default to expense if unclear to avoid losing data, but filter out explicit revenue

                    if (year && chapter && titleCode && isLeaf && isExpense) {
                        const yearNum = Number(year);
                        // Strict validation to avoid garbage data (e.g. from wrong columns)
                        if (yearNum >= 2000 && yearNum <= 2100) { // Removed district !== 'Berlin' to allow city-wide data
                            records.push({
                                year: yearNum,
                                district: district,
                                chapter: String(chapter),
                                title_code: titleStr,
                                budget: budget || 0,
                                actual: actual || 0,
                                diff: (budget || 0) - (actual || 0)
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing file ${file}:`, error);
        }
    }

    // Ensure processed directory exists
    if (!fs.existsSync(PROCESSED_DIR)) {
        fs.mkdirSync(PROCESSED_DIR, { recursive: true });
    }

    const outputPath = path.join(PROCESSED_DIR, 'financial_data.json');
    // Process subsidies if exists
    const subsidiesPath = path.join(RAW_DIR, 'subsidies.csv');
    if (fs.existsSync(subsidiesPath)) {
        console.log('Processing subsidies...');
        const subsidyRecords = parseSubsidies(subsidiesPath);
        // We'll save these to a separate file to keep the main budget data clean
        const subsidiesProcessedPath = path.join(path.dirname(outputPath), 'subsidies_data.json');
        fs.writeFileSync(subsidiesProcessedPath, JSON.stringify(subsidyRecords, null, 2));
        console.log(`Saved ${subsidyRecords.length} subsidy records to ${subsidiesProcessedPath}`);
    }

    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

    console.log(`Processed ${records.length} records. Saved to ${outputPath}`);
    return records;
}

/**
 * Smart Schema-Mapper to detect and parse currency formats.
 * Handles:
 * - German: "1.000,00" -> 1000.00
 * - International: "1,000.00" -> 1000.00
 * - Plain: 1000 -> 1000
 */
export function parseCurrency(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;

    const trimmed = val.trim();
    if (!trimmed) return 0;

    // Check for German format (e.g. 1.234,56 or 1234,56)
    // Condition: Contains comma at the end (for decimals) and optionally dots as thousands separators
    const isGerman = /^-?[\d\.]+(,\d+)?$/.test(trimmed) && trimmed.indexOf(',') > -1 && (trimmed.indexOf('.') === -1 || trimmed.lastIndexOf('.') < trimmed.indexOf(','));

    // Check for International format (e.g. 1,234.56 or 1234.56)
    // Condition: Contains dot at the end (for decimals) and optionally commas as thousands separators
    const isInternational = /^-?[\d,]+(\.\d+)?$/.test(trimmed) && trimmed.indexOf('.') > -1 && (trimmed.indexOf(',') === -1 || trimmed.lastIndexOf(',') < trimmed.indexOf('.'));

    let normalized = trimmed;

    if (isGerman) {
        // Remove all dots (thousands), replace comma with dot
        normalized = trimmed.replace(/\./g, '').replace(',', '.');
    } else if (isInternational) {
        // Remove all commas (thousands)
        normalized = trimmed.replace(/,/g, '');
    }

    // Fallback: simple float parse if neither pattern perfectly matches but it's a number string
    const result = parseFloat(normalized);
    return isNaN(result) ? 0 : result;
}

function getDistrictFromFilename(filename: string): string {
    const districts = [
        'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
        'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln',
        'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
    ];

    const normalizedname = filename.toLowerCase().replace(/_/g, ' ');
    for (const d of districts) {
        if (normalizedname.includes(d.toLowerCase())) {
            return d;
        }
    }
    return 'Berlin'; // Default if not found
}

function parseDoppelhaushalt(filePath: string): FinancialRecord[] {
    // Try reading as UTF-8 first
    let content = fs.readFileSync(filePath, 'utf-8');

    // If we detect the replacement character (), it's likely a Latin1/Windows-1252 file read as UTF-8
    if (content.includes('\uFFFD')) {
        console.log(`[Parser] Detected encoding issues in ${path.basename(filePath)}, retrying as latin1`);
        content = fs.readFileSync(filePath, 'latin1');
    }

    const lines = content.split('\n');
    const records: FinancialRecord[] = [];

    // Header: ID;Typ;Bezeichnung;Bereich;Bereichsbezeichnung;...
    // We expect semicolon separator

    // Skip heater
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(';');
        if (cols.length < 27) continue;

        // Bereich (col 3) -> District ID. 30=Hauptverwaltung, 31=Mitte ... 41=Reinickendorf
        // Bereichsbezeichnung (col 4) -> District Name
        const districtName = cols[4];

        const year = parseInt(cols[24]); // Jahr
        const budgetType = cols[25]; // BetragTyp
        const amount = parseFloat(cols[26].replace(',', '.')); // Betrag
        const titleArt = cols[21]; // Titelart
        const titleCode = cols[22]; // Titel

        // ONLY process Expenses (Ausgabetitel) to get the actual spending budget
        // AND ensure it's a leaf node title (usually 5 digits)
        if (titleArt !== 'Ausgabetitel') continue;
        if (!titleCode || titleCode.length !== 5) continue;

        if (isNaN(amount)) continue;

        const budget = budgetType === 'Soll' ? amount : 0;
        const actual = budgetType === 'Ist' ? amount : 0;

        records.push({
            year: year,
            district: districtName || 'Berlin',
            chapter: cols[7] + ' ' + cols[8], // Kapitel + Bezeichnung
            title_code: titleCode, // Titel
            budget: budget,
            actual: actual,
            diff: budget - actual
        });
    }
    return records;
}

export interface SubsidyRecord {
    id: string;
    recipient: string;
    provider: string;
    type: string;
    year: number;
    address: string;
    area: string;
    purpose: string;
    amount: number;
}

function parseSubsidies(filePath: string): SubsidyRecord[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const records: SubsidyRecord[] = [];

    // id;name;geber;art;jahr;anschrift;politikbereich;zweck;betrag;empfaengerid
    // First line is header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Proper CSV parsing that respects quotes
        const cols = parseCsvLine(line, ';');
        if (cols.length < 9) continue;

        const amountStr = cols[8].replace(/[^-0-9,]/g, '').replace(',', '.');
        const amount = parseFloat(amountStr) || 0;

        records.push({
            id: cols[0],
            recipient: cols[1],
            provider: cols[2],
            type: cols[3],
            year: parseInt(cols[4]) || 0,
            address: cols[5],
            area: cols[6],
            purpose: cols[7],
            amount: amount
        });
    }

    return records;
}

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            // Handle escaped quotes ("")
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // Push the last field
    result.push(current);

    return result;
}

