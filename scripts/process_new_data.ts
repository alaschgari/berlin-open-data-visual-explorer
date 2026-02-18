
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const RAW_TAX_FILE = path.join(process.cwd(), 'data/raw/steuereinnahmen_012026.csv');
const PROCESSED_TAX_FILE = path.join(process.cwd(), 'data/processed/taxes_012026.json');

const RAW_DEMO_FILE = path.join(process.cwd(), 'data/raw/EWR_L21_202412E_Matrix.csv');
const PROCESSED_DEMO_FILE = path.join(process.cwd(), 'data/processed/demographics_2024.json');

async function processTaxes() {
    console.log('Processing Taxes data...');
    if (!fs.existsSync(RAW_TAX_FILE)) {
        console.warn('Raw tax file not found:', RAW_TAX_FILE);
        return;
    }

    const fileContent = fs.readFileSync(RAW_TAX_FILE, 'utf8');
    const results = Papa.parse(fileContent, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
    });

    const processedData = results.data.map((row: any) => {
        const parseNumber = (val: string) => {
            if (!val) return 0;
            const cleanVal = val.replace(/\./g, '').replace(',', '.');
            return parseFloat(cleanVal) * 1000;
        };

        const type = (row['Steuerart'] || '').trim();
        const category = (row['Ertragshoheit'] || '').trim();

        let suffix = '';
        const catLower = category.toLowerCase();
        if (catLower.includes('landesanteil') || catLower.includes('landessteuern')) suffix = ' (Land)';
        else if (catLower.includes('gemeindeanteil') || catLower.includes('gemeindesteuern')) suffix = ' (Gemeinde)';

        return {
            type: `${type}${suffix}`,
            category: category,
            monthlyAmount: parseNumber(row[' Einnahmen Januar 2026 (T EUR)']),
            cumulativeAmount: parseNumber(row['Einnahmen bis Januar 2026 (T EUR)']),
        };
    }).filter((item: any) => item.type && item.monthlyAmount !== 0);

    // Extract period from header
    const lines = fileContent.split('\n');
    const header = lines[0].split(';');
    const periodMatch = header[2]?.match(/Einnahmen (.*) \(T EUR\)/);
    const period = periodMatch ? periodMatch[1] : 'Januar 2026';

    const output = {
        period,
        data: processedData
    };

    fs.mkdirSync(path.dirname(PROCESSED_TAX_FILE), { recursive: true });
    fs.writeFileSync(PROCESSED_TAX_FILE, JSON.stringify(output, null, 2));
    console.log('Taxes processing complete.');
}

async function processDemographics() {
    console.log('Processing Demographics data...');
    if (!fs.existsSync(RAW_DEMO_FILE)) {
        console.warn('Raw demographics file not found:', RAW_DEMO_FILE);
        return;
    }

    const fileContent = fs.readFileSync(RAW_DEMO_FILE, 'utf8');
    const { data } = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimiter: ';',
    });

    fs.mkdirSync(path.dirname(PROCESSED_DEMO_FILE), { recursive: true });
    fs.writeFileSync(PROCESSED_DEMO_FILE, JSON.stringify(data, null, 2));
    console.log('Demographics processing complete.');
}

const RAW_LOR_WGS84 = path.join(process.cwd(), 'data/raw/lor_planungsraeume_2021_wgs84.geojson');
const RAW_LOR_ORIG = path.join(process.cwd(), 'data/raw/lor_planungsraeume_2021.geojson');
const PROCESSED_LOR_FILE = path.join(process.cwd(), 'data/processed/lor_data.json');

async function processLOR() {
    console.log('Processing LOR data...');
    let rawPath = RAW_LOR_WGS84;
    if (!fs.existsSync(rawPath)) {
        rawPath = RAW_LOR_ORIG;
    }

    if (!fs.existsSync(rawPath)) {
        console.warn('Raw LOR file not found');
        return;
    }

    const content = fs.readFileSync(rawPath, 'utf8');
    // Ensure it's valid JSON before saving to processed
    const data = JSON.parse(content);

    fs.mkdirSync(path.dirname(PROCESSED_LOR_FILE), { recursive: true });
    fs.writeFileSync(PROCESSED_LOR_FILE, JSON.stringify(data));
    console.log('LOR processing complete.');
}

async function main() {
    try {
        await processTaxes();
        await processDemographics();
        await processLOR();
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
