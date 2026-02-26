
import { fetchBicycleTheftData } from '../src/lib/scraper';
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

    console.log("Updating Bicycle Theft Data...");
    const success = await fetchBicycleTheftData();
    if (success) {
        console.log("Update successful. New data saved to data/raw/Fahrraddiebstahl.csv");
    } else {
        console.log("Update failed. Check logs for details.");
    }
}

main().catch(console.error);
