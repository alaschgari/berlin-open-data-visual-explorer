import { fetchBerlinData } from '../src/lib/scraper';
import { processFiles } from '../src/lib/parser';
import { supabase } from '../src/lib/supabase';
import { existsSync } from 'fs';

async function main() {
    // Load local environment variables if they exist
    if (existsSync('.env.local')) {
        try {
            // @ts-ignore - process.loadEnvFile is available in Node 20.12+
            process.loadEnvFile('.env.local');
            console.log('Loaded environment variables from .env.local');
        } catch (err) {
            console.warn('Note: Could not load .env.local:', err);
        }
    }

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

    // Step 2: Processing files
    // Note: Theft data is processed on-demand in the UI or by other scripts.
    // This script now only focuses on ensuring the latest raw files are present.

    console.log('\n--- Step 2: Sync complete ---');
    console.log(`\n=== Sync complete at ${new Date().toISOString()} ===`);
}

main().catch((err) => {
    console.error('Unexpected Sync Failure:', err);
    process.exit(1);
});
