import fs from 'fs';
import path from 'path';
import pkg from 'papaparse';
const { parse } = pkg;

const DATA_URL = 'https://media.githubusercontent.com/media/IHKBerlin/IHKBerlin_Gewerbedaten/refs/heads/master/data/IHKBerlin_Gewerbedaten.csv';
const RAW_FILE = path.join(process.cwd(), 'data/raw/IHKBerlin_Gewerbedaten.csv');
const PROCESSED_FILE = path.join(process.cwd(), 'data/processed/business_aggregated.json');
const SEARCH_INDEX_FILE = path.join(process.cwd(), 'data/processed/business_search_index.json');
const LOR_DETAILS_DIR = path.join(process.cwd(), 'data/processed/lor_details');

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

    const aggregatedResults: any = {
        byLor: {},
        global: {
            total: 0,
            branches: {},
            employeeRanges: {}
        }
    };

    const searchIndex: any[] = [];
    const lorDetails: Record<string, any[]> = {};

    parse(csvData, {
        header: true,
        skipEmptyLines: true,
        step: (row) => {
            const data: any = row.data;
            const lorId = data.planungsraum_id;
            const branch = data.branch_top_level_desc;
            const ihkBranch = data.ihk_branch_desc;
            const employees = data.employees_range;

            if (!lorId) return;

            // --- 1. Aggregation (Existing) ---
            if (!aggregatedResults.byLor[lorId]) {
                aggregatedResults.byLor[lorId] = {
                    count: 0,
                    branches: {},
                    employeeRanges: {}
                };
            }

            aggregatedResults.byLor[lorId].count++;
            aggregatedResults.byLor[lorId].branches[branch] = (aggregatedResults.byLor[lorId].branches[branch] || 0) + 1;
            aggregatedResults.byLor[lorId].employeeRanges[employees] = (aggregatedResults.byLor[lorId].employeeRanges[employees] || 0) + 1;

            aggregatedResults.global.total++;
            aggregatedResults.global.branches[branch] = (aggregatedResults.global.branches[branch] || 0) + 1;
            aggregatedResults.global.employeeRanges[employees] = (aggregatedResults.global.employeeRanges[employees] || 0) + 1;


            // --- 2. Details per LOR ---
            if (!lorDetails[lorId]) {
                lorDetails[lorId] = [];
            }
            const detailItem = {
                id: data.opendata_id,
                city: data.city,
                postcode: data.postcode,
                employees: data.employees_range,
                branch: ihkBranch || '',
                top_branch: branch || '',
                type: data.business_type,
                age: data.business_age,
                planungsraum: data.Planungsraum,
                lat: parseFloat(data.latitude),
                lng: parseFloat(data.longitude)
            };
            lorDetails[lorId].push(detailItem);

            // --- 3. Search Index ---
            // Only store fields required for search filtering to keep it small
            searchIndex.push({
                id: data.opendata_id,
                lat: parseFloat(data.latitude),
                lng: parseFloat(data.longitude),
                branch: ihkBranch,
                employees: data.employees_range,
                type: data.business_type,
                age: data.business_age,
                city: data.city,
                postcode: data.postcode,
                lorId: data.planungsraum_id
            });
        },
        complete: () => {
            console.log('Processing complete. Saving results...');

            // Save Aggregated File
            fs.mkdirSync(path.dirname(PROCESSED_FILE), { recursive: true });
            fs.writeFileSync(PROCESSED_FILE, JSON.stringify(aggregatedResults));
            console.log(`Saved aggregated data to ${PROCESSED_FILE}`);

            // Save Search Index
            fs.writeFileSync(SEARCH_INDEX_FILE, JSON.stringify(searchIndex));
            console.log(`Saved search index to ${SEARCH_INDEX_FILE} (${(fs.statSync(SEARCH_INDEX_FILE).size / (1024 * 1024)).toFixed(2)} MB)`);

            // Save Individual LOR Detail Files
            fs.mkdirSync(LOR_DETAILS_DIR, { recursive: true });
            let lortCount = 0;
            for (const [lor, items] of Object.entries(lorDetails)) {
                fs.writeFileSync(path.join(LOR_DETAILS_DIR, `${lor}.json`), JSON.stringify(items));
                lortCount++;
            }
            console.log(`Saved ${lortCount} individual LOR detail files to ${LOR_DETAILS_DIR}`);
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
