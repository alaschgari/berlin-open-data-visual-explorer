import { fetchBerlinData } from '../src/lib/scraper';
import { processFiles } from '../src/lib/parser';

async function main() {
    console.log('=== Berlin Open Data Sync ===');
    console.log(`Started at: ${new Date().toISOString()}`);

    // Step 1: Download raw data
    console.log('\n--- Step 1: Downloading raw data ---');
    const result = await fetchBerlinData();

    if (!result.success) {
        console.error('Download failed:', result.error);
        process.exit(1);
    }

    console.log(`Downloaded ${result.count} resources.`);

    // Step 2: Process raw → JSON
    console.log('\n--- Step 2: Processing files ---');
    const records = await processFiles();
    console.log(`Processed ${records.length} records into data/processed/`);

    console.log(`\n=== Sync complete at ${new Date().toISOString()} ===`);
}

main().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});
