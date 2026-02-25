import { fetchBerlinData } from '../src/lib/scraper';
import { processFiles } from '../src/lib/parser';
import { supabase } from '../src/lib/supabase';

async function main() {
    console.log('=== Berlin Open Data Sync ===');
    console.log(`Started at: ${new Date().toISOString()}`);

    // Step 1: Download raw data
    console.log('\n--- Step 1: Downloading raw data ---');
    const result = await fetchBerlinData();

    if (!result.success) {
        console.error('Critical Error: Basic data fetch failed entirely.');
        process.exit(1);
    }

    console.log(`\nSync summary: Downloaded ${result.count} resources successfully.`);
    if (result.error) {
        console.warn('Note: Some non-critical resources could not be fetched.');
    }

    // Step 2: Process raw → JSON
    console.log('\n--- Step 2: Processing files ---');
    try {
        let { financialRecords, subsidyRecords } = await processFiles();

        // Filter out records with invalid year
        financialRecords = financialRecords.filter(r => r.year && !isNaN(r.year));
        subsidyRecords = subsidyRecords.filter(r => r.year && !isNaN(r.year));

        // Deduplicate financial records based on unique constraint
        console.log('Deduplicating financial records...');
        const uniqueFinancialRecords = new Map<string, any>();
        for (const record of financialRecords) {
            const key = `${record.year}-${record.district}-${record.chapter}-${record.title_code}`;
            if (uniqueFinancialRecords.has(key)) {
                const existing = uniqueFinancialRecords.get(key);
                existing.budget += record.budget;
                existing.actual += record.actual;
                existing.diff = existing.budget - existing.actual;
            } else {
                uniqueFinancialRecords.set(key, { ...record });
            }
        }
        const deduplicatedFinancial = Array.from(uniqueFinancialRecords.values());
        console.log(`Deduplicated from ${financialRecords.length} to ${deduplicatedFinancial.length} records.`);

        // Push records with all fields (including the new 'title' column)
        const recordsToPush = deduplicatedFinancial;

        console.log(`Pushing ${recordsToPush.length} financial records to Supabase...`);
        // Use upsert with a large batch size
        const CHUNK_SIZE = 1000;
        for (let i = 0; i < recordsToPush.length; i += CHUNK_SIZE) {
            const chunk = recordsToPush.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
                .from('financial_records')
                .upsert(chunk, { onConflict: 'year,district,chapter,title_code' });

            if (error) {
                console.error(`Error pushing financial chunk ${i / CHUNK_SIZE}:`, error.message);
            } else {
                process.stdout.write('.');
            }
        }
        console.log('\nFinancial records sync complete.');

        if (subsidyRecords.length > 0) {
            console.log(`Pushing ${subsidyRecords.length} subsidy records to Supabase...`);
            for (let i = 0; i < subsidyRecords.length; i += CHUNK_SIZE) {
                const chunk = subsidyRecords.slice(i, i + CHUNK_SIZE);
                const { error } = await supabase
                    .from('subsidies')
                    .upsert(chunk, { onConflict: 'id' });

                if (error) {
                    console.error(`Error pushing subsidy chunk ${i / CHUNK_SIZE}:`, error.message);
                } else {
                    process.stdout.write('.');
                }
            }
            console.log('\nSubsidy records sync complete.');
        }

    } catch (err: any) {
        console.error('Error during sync processing:', err.message);
        process.exit(1);
    }

    console.log(`\n=== Sync complete at ${new Date().toISOString()} ===`);
}

main().catch((err) => {
    console.error('Unexpected Sync Failure:', err);
    process.exit(1);
});
