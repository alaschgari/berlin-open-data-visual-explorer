
import { fetchBicycleTheftData } from '../src/lib/scraper';

async function main() {
    console.log("Updating Bicycle Theft Data...");
    const success = await fetchBicycleTheftData();
    if (success) {
        console.log("Update successful. New data saved to data/raw/Fahrraddiebstahl.csv");
    } else {
        console.log("Update failed. Check logs for details.");
    }
}

main().catch(console.error);
