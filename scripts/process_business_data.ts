
import fs from 'fs';
import path from 'path';
import { parse } from 'papaparse';

const DATA_URL = 'https://media.githubusercontent.com/media/IHKBerlin/IHKBerlin_Gewerbedaten/refs/heads/master/data/IHKBerlin_Gewerbedaten.csv';
const RAW_FILE = path.join(process.cwd(), 'data/raw/IHKBerlin_Gewerbedaten.csv');
const PROCESSED_FILE = path.join(process.cwd(), 'data/processed/business_aggregated.json');

async function downloadData() {
    console.log('Checking for raw data...');
    if (fs.existsSync(RAW_FILE)) {
        console.log('File already exists, skipping download.');
        return;
    }

    console.log('Downloading IHK Business Data (~128MB)...');
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);

    const buffer = await response.arrayBuffer();
    fs.mkdirSync(path.dirname(RAW_FILE), { recursive: true });
    fs.writeFileSync(RAW_FILE, Buffer.from(buffer));
    console.log('Download complete.');
}

async function processData() {
    console.log('Processing data...');
    const csvData = fs.readFileSync(RAW_FILE, 'utf8');

    const results: any = {
        byLor: {},
        global: {
            total: 0,
            branches: {},
            employeeRanges: {}
        }
    };

    parse(csvData, {
        header: true,
        skipEmptyLines: true,
        step: (row) => {
            const data: any = row.data;
            const lorId = data.planungsraum_id;
            const branch = data.branch_top_level_desc;
            const employees = data.employees_range;

            if (!lorId) return;

            if (!results.byLor[lorId]) {
                results.byLor[lorId] = {
                    count: 0,
                    branches: {},
                    employeeRanges: {}
                };
            }

            // Update LOR stats
            results.byLor[lorId].count++;
            results.byLor[lorId].branches[branch] = (results.byLor[lorId].branches[branch] || 0) + 1;
            results.byLor[lorId].employeeRanges[employees] = (results.byLor[lorId].employeeRanges[employees] || 0) + 1;

            // Update Global stats
            results.global.total++;
            results.global.branches[branch] = (results.global.branches[branch] || 0) + 1;
            results.global.employeeRanges[employees] = (results.global.employeeRanges[employees] || 0) + 1;
        },
        complete: () => {
            console.log('Processing complete. Saving results...');
            fs.mkdirSync(path.dirname(PROCESSED_FILE), { recursive: true });
            fs.writeFileSync(PROCESSED_FILE, JSON.stringify(results, null, 2));
            console.log(`Saved aggregated data to ${PROCESSED_FILE}`);
        }
    });
}

async function main() {
    try {
        await downloadData();
        await processData();
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
