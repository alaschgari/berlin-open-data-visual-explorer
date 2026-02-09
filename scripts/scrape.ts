
import { fetchBerlinData } from '../src/lib/scraper';

async function main() {
    console.log("Starting full scrape...");
    const result = await fetchBerlinData();
    console.log("Scrape complete:", result);
}

main().catch(console.error);
